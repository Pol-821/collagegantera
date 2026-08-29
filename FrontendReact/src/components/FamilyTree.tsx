import { useState, useMemo, useRef, useEffect } from 'react'
import { User, MoreVertical, Pencil, Trash, Link } from 'lucide-react'

export interface FamilyMemberNode {
  id: string
  nom: string
  cognoms: string
  role: string
  isFamilyHead: boolean
  hasAccount: boolean
  avatarUrl?: string | null
}

interface FamilyTreeProps {
  members: FamilyMemberNode[]
  currentUserId?: string
  isHead?: boolean
  onEdit: (member: FamilyMemberNode) => void
  onDelete: (userId: string) => void
  onLinkAccount: (userId: string) => void
}

const NODE_W = 110
const NODE_H = 88
const SIBLING_GAP = 24
const LEVEL_GAP = 80
const PARTNER_GAP = 10
const PAD = 40

function getGen(r: string): number {
  const GEN: Record<string, number> = {
    'Avi': 0, 'Àvia': 0, 'Avi polític': 0, 'Àvia política': 0,
    'Pare': 1, 'Mare': 1, 'Sogre': 1, 'Sogra': 1, 'Tiet': 1, 'Tieta': 1,
    'Espòs/Esposa': 2,
    'Fill': 3, 'Filla': 3, 'Gendre': 3, 'Nora': 3,
    'Net': 4, 'Neta': 4, 'Net polític': 4, 'Neta política': 4,
  }
  const GEN2_ROLES = new Set(['Germà', 'Germà/Germana', 'Cunyat', 'Cunyada', 'Cosí', 'Cosina'])
  if (GEN[r] !== undefined) return GEN[r]
  if (GEN2_ROLES.has(r)) return 2
  return 2
}

function isPartnerRole(a: string, b: string): boolean {
  const pairs: [string, string][] = [
    ['Pare', 'Mare'], ['Sogre', 'Sogra'], ['Tiet', 'Tieta'],
    ['Avi', 'Àvia'], ['Avi polític', 'Àvia política'],
    ['Espòs/Esposa', 'Fill'], ['Espòs/Esposa', 'Filla'],
  ]
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

interface Pos { member: FamilyMemberNode; x: number; y: number }
interface Line { x1: number; y1: number; x2: number; y2: number }
interface Layout { nodes: Pos[]; lines: Line[] }

function pairPartners(members: FamilyMemberNode[]): FamilyMemberNode[][] {
  const used = new Set<string>()
  const pairs: FamilyMemberNode[][] = []
  for (const m of members) {
    if (used.has(m.id)) continue
    const partner = members.find(
      o => !used.has(o.id) && o.id !== m.id && isPartnerRole(m.role, o.role)
    )
    if (partner) {
      pairs.push([m, partner])
      used.add(m.id)
      used.add(partner.id)
    } else {
      pairs.push([m])
      used.add(m.id)
    }
  }
  return pairs
}

function computeLayout(members: FamilyMemberNode[], currentUserId?: string): Layout {
  if (!members.length) return { nodes: [], lines: [] }

  const currentUser = currentUserId
    ? members.find(m => m.id === currentUserId)
    : members.find(m => m.isFamilyHead) || members[0]

  if (!currentUser) return { nodes: [], lines: [] }

  const currentGen = getGen(currentUser.role)

  // Assign each member a generation relative to current user's role-based gen
  // Members with same gen as current user → gen 2 (center)
  // Members with gen < current user's gen → shift up (lower gen = above)
  // Members with gen > current user's gen → shift down (higher gen = below)
  const byGen = new Map<number, FamilyMemberNode[]>()
  for (const m of members) {
    const rawGen = getGen(m.role)
    // Normalize so current user's generation is always 2
    const shiftedGen = 2 + (rawGen - currentGen)
    const g = Math.max(0, Math.min(4, shiftedGen))
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(m)
  }

  const sortedGens = Array.from(byGen.keys()).sort((a, b) => a - b)

  // Pair partners at each generation
  const genPairs: Map<number, FamilyMemberNode[][]> = new Map()
  for (const g of sortedGens) {
    const genMembers = byGen.get(g)!
    if (g === 2) {
      // Center generation: put current user first with their partner
      const currentPartner = genMembers.find(
        m => m.id !== currentUser.id && isPartnerRole(currentUser.role, m.role)
      )
      const rest = genMembers.filter(m => m.id !== currentUser.id && m.id !== currentPartner?.id)
      const pair = currentPartner ? [currentUser, currentPartner] : [currentUser]
      genPairs.set(g, [pair, ...pairPartners(rest)])
    } else {
      genPairs.set(g, pairPartners(genMembers))
    }
  }

  // Compute widths
  const genWidths = new Map<number, number>()
  for (const g of sortedGens) {
    const pairs = genPairs.get(g)!
    let w = 0
    for (const pair of pairs) {
      w += pair.length === 2 ? NODE_W * 2 + PARTNER_GAP : NODE_W
      w += SIBLING_GAP
    }
    w -= SIBLING_GAP
    genWidths.set(g, w)
  }

  const treeWidth = Math.max(...Array.from(genWidths.values()), NODE_W)

  // Compute Y positions
  const genPositions = new Map<number, number>()
  let curY = PAD
  for (const g of sortedGens) {
    genPositions.set(g, curY)
    curY += NODE_H + LEVEL_GAP
  }

  const nodes: Pos[] = []
  const lines: Line[] = []
  const genCenters = new Map<number, number[]>()

  for (const g of sortedGens) {
    const pairs = genPairs.get(g)!
    const gw = genWidths.get(g)!
    const startX = (treeWidth - gw) / 2 + PAD
    const y = genPositions.get(g)!
    const centers: number[] = []

    let cx = startX
    for (const pair of pairs) {
      const pairW = pair.length === 2 ? NODE_W * 2 + PARTNER_GAP : NODE_W
      for (let i = 0; i < pair.length; i++) {
        nodes.push({ member: pair[i], x: cx + i * (NODE_W + PARTNER_GAP), y })
      }
      if (pair.length === 2) {
        lines.push({
          x1: cx + NODE_W, y1: y + NODE_H / 2,
          x2: cx + NODE_W + PARTNER_GAP, y2: y + NODE_H / 2,
        })
      }
      centers.push(cx + pairW / 2)
      cx += pairW + SIBLING_GAP
    }
    genCenters.set(g, centers)
  }

  // Draw lines between generations
  for (let i = 0; i < sortedGens.length - 1; i++) {
    const parentGen = sortedGens[i]
    const childGen = sortedGens[i + 1]
    const parentCenters = genCenters.get(parentGen)!
    const childCenters = genCenters.get(childGen)!
    const parentY = genPositions.get(parentGen)! + NODE_H
    const childY = genPositions.get(childGen)!
    const branchY = parentY + (childY - parentY) * 0.4

    if (parentCenters.length === 1) {
      const px = parentCenters[0]
      if (childCenters.length === 1) {
        lines.push({ x1: px, y1: parentY, x2: childCenters[0], y2: childY })
      } else {
        lines.push({ x1: px, y1: parentY, x2: px, y2: branchY })
        const leftX = Math.min(...childCenters)
        const rightX = Math.max(...childCenters)
        lines.push({ x1: leftX, y1: branchY, x2: rightX, y2: branchY })
        for (const chx of childCenters) {
          lines.push({ x1: chx, y1: branchY, x2: chx, y2: childY })
        }
      }
    } else {
      const avgPX = parentCenters.reduce((s, x) => s + x, 0) / parentCenters.length
      lines.push({ x1: avgPX, y1: parentY, x2: avgPX, y2: branchY })
      if (childCenters.length === 1) {
        lines.push({ x1: avgPX, y1: branchY, x2: childCenters[0], y2: branchY })
        lines.push({ x1: childCenters[0], y1: branchY, x2: childCenters[0], y2: childY })
      } else {
        const leftX = Math.min(...childCenters)
        const rightX = Math.max(...childCenters)
        lines.push({ x1: leftX, y1: branchY, x2: rightX, y2: branchY })
        for (const chx of childCenters) {
          lines.push({ x1: chx, y1: branchY, x2: chx, y2: childY })
        }
      }
    }
  }

  return { nodes, lines }
}

function TreeNode({ node, isHead, onEdit, onDelete, onLinkAccount, isCurrentUser }: {
  node: Pos; isHead?: boolean; onEdit: (m: FamilyMemberNode) => void; onDelete: (id: string) => void
  onLinkAccount: (id: string) => void; isCurrentUser: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const bc = isCurrentUser
    ? 'border-primary ring-2 ring-primary/20'
    : node.member.isFamilyHead
      ? 'border-emerald-500 dark:border-emerald-400'
      : node.member.hasAccount ? 'border-blue-400 dark:border-blue-300' : 'border-muted-foreground/30'

  return (
    <div ref={ref} className="absolute group" style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}>
      <div className={`relative w-full h-full rounded-xl border-2 ${bc} bg-card shadow-sm flex flex-col items-center justify-center gap-0.5 transition-shadow hover:shadow-md`}>
        {node.member.avatarUrl ? (
          <img src={node.member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {node.member.nom?.[0] || '?'}
          </div>
        )}
        <p className="text-[10px] font-semibold text-center leading-tight px-1 truncate w-full text-foreground">
          {node.member.nom}
        </p>
        <p className="text-[9px] text-muted-foreground text-center truncate w-full px-1">
          {node.member.isFamilyHead ? 'Cap de família' : node.member.role}
        </p>

        <div className="absolute -top-2 -right-2 z-50">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-card border rounded-full p-0.5 shadow-sm hover:bg-muted">
            <MoreVertical className="h-3 w-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-50 bg-card border rounded-lg shadow-lg py-1 min-w-[150px]">
              {isHead && !node.member.isFamilyHead && (
                <button onClick={() => { onEdit(node.member); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
              )}
              {isHead && !node.member.isFamilyHead && (
                <button onClick={() => { onDelete(node.member.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted text-red-600">
                  <Trash className="h-3.5 w-3.5" /> Eliminar
                </button>
              )}
              {isHead && !node.member.hasAccount && (
                <button onClick={() => { onLinkAccount(node.member.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted">
                  <Link className="h-3.5 w-3.5" /> Vincular compte
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FamilyTree({ members, currentUserId, isHead, onEdit, onDelete, onLinkAccount }: FamilyTreeProps) {
  const layout = useMemo(() => computeLayout(members, currentUserId), [members, currentUserId])

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mb-3 opacity-40" />
        <p>No hi ha membres per mostrar a l'arbre.</p>
      </div>
    )
  }

  const maxX = Math.max(...layout.nodes.map(n => n.x + NODE_W), 0) + PAD
  const maxY = Math.max(...layout.nodes.map(n => n.y + NODE_H), 0) + PAD

  return (
    <div className="w-full overflow-x-auto py-4 flex justify-center">
      <div className="relative" style={{ width: maxX, height: maxY }}>
        <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY}>
          {layout.lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
          ))}
        </svg>
        {layout.nodes.map(n => (
          <TreeNode key={n.member.id} node={n} isHead={isHead} onEdit={onEdit} onDelete={onDelete}
            onLinkAccount={onLinkAccount} isCurrentUser={n.member.id === currentUserId} />
        ))}
      </div>
    </div>
  )
}
