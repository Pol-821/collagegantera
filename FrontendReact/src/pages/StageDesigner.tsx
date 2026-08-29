import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import type { Event } from '@/types'
import { Users, Save, Plus, X, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'

interface StagePosition {
  userId: string
  danceName: string
  x: number
  y: number
}

export default function StageDesigner() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canvasRef = useRef<HTMLDivElement>(null)

  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [positions, setPositions] = useState<StagePosition[]>([])
  const [dances, setDances] = useState<string[]>([])
  const [currentDance, setCurrentDance] = useState('')
  const [newDanceName, setNewDanceName] = useState('')
  const [draggingMember, setDraggingMember] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedOnCanvas, setSelectedOnCanvas] = useState<string | null>(null)
  const [roleGroups, setRoleGroups] = useState<Record<string, string[]>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const canEdit = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/events/${id}/registrations`),
      api.get(`/events/${id}/stage/dances`),
      api.get('/settings/role-groups'),
    ])
      .then(([eventRes, regRes, dancesRes, groupsRes]) => {
        setEvent(eventRes.data)
        setRegistrations(Array.isArray(regRes.data) ? regRes.data : [])
        const danceList = Array.isArray(dancesRes.data) ? dancesRes.data : []
        setDances(danceList)
        if (dancesRes.data.default) {
          setCurrentDance(dancesRes.data.default)
        } else if (danceList.length > 0) {
          setCurrentDance(danceList[0])
        }
        setRoleGroups(groupsRes.data || {})
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !currentDance) return
    api
      .get(`/events/${id}/stage`, { params: { dance: currentDance } })
      .then((res) => {
        setPositions(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => setPositions([]))
  }, [id, currentDance])

  const placedUserIds = new Set(positions.map((p) => p.userId))

  const unplacedMembers = registrations.filter((r) => {
    const userId = r.userId || r.user?.id || r.id
    return !placedUserIds.has(userId)
  })

  const getMemberName = (member: any) => {
    if (member.user) return `${member.user.nom} ${member.user.cognoms}`
    if (member.nom) return `${member.nom} ${member.cognoms || ''}`
    return 'Desconegut'
  }

  const getMemberRole = (member: any) => {
    return member.assignedRole || member.assignedrole || ''
  }

  const findGroupForRole = (role: string): string => {
    if (!role) return ''
    for (const [group, subs] of Object.entries(roleGroups)) {
      if (group === role || subs.includes(role) || role.startsWith(`${group} -`)) return group
    }
    return ''
  }

  const groupedUnplaced: Record<string, any[]> = { '': [] }
  Object.keys(roleGroups).forEach((g) => { groupedUnplaced[g] = [] })
  unplacedMembers.forEach((m) => {
    const role = getMemberRole(m)
    const group = findGroupForRole(role)
    if (group && groupedUnplaced[group]) {
      groupedUnplaced[group].push(m)
    } else {
      groupedUnplaced[''].push(m)
    }
  })

  const toggleGroup = (g: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const allExpanded = Object.keys(roleGroups).every((g) => expandedGroups.has(g))
  const toggleAll = () => {
    if (allExpanded) setExpandedGroups(new Set())
    else setExpandedGroups(new Set(Object.keys(roleGroups)))
  }

  const getMemberUserId = (member: any) => {
    return member.userId || member.user?.id || member.id
  }

  const percentToPixel = (pct: number) => {
    return (pct / 100) * 800
  }

  const pixelToPercent = (px: number) => {
    return Math.max(0, Math.min(100, (px / 800) * 100))
  }

  const getCanvasMousePos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const handleMouseDown = useCallback(
    (userId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const existing = positions.find((p) => p.userId === userId)
      if (existing) {
        const px = percentToPixel(existing.x)
        const py = percentToPixel(existing.y)
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const canvasX = e.clientX - rect.left
          const canvasY = e.clientY - rect.top
          setDragOffset({ x: canvasX - px, y: canvasY - py })
        }
      } else {
        setDragOffset({ x: 0, y: 0 })
      }
      setDraggingMember(userId)
      setSelectedOnCanvas(userId)
    },
    [positions]
  )

  useEffect(() => {
    if (!draggingMember) return

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      const canvasY = e.clientY - rect.top
      const xPct = pixelToPercent(canvasX - dragOffset.x)
      const yPct = pixelToPercent(canvasY - dragOffset.y)

      setPositions((prev) => {
        const existing = prev.find((p) => p.userId === draggingMember)
        if (existing) {
          return prev.map((p) =>
            p.userId === draggingMember ? { ...p, x: xPct, y: yPct } : p
          )
        }
        return prev
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const canvasX = e.clientX - rect.left
        const canvasY = e.clientY - rect.top
        const inBounds = canvasX >= 0 && canvasX <= rect.width && canvasY >= 0 && canvasY <= rect.height

        if (inBounds && canvasRef.current) {
          const xPct = pixelToPercent(canvasX - dragOffset.x)
          const yPct = pixelToPercent(canvasY - dragOffset.y)

          setPositions((prev) => {
            const existing = prev.find((p) => p.userId === draggingMember)
            if (existing) {
              return prev.map((p) =>
                p.userId === draggingMember ? { ...p, x: xPct, y: yPct } : p
              )
            }
            if (currentDance) {
              return [...prev, { userId: draggingMember, danceName: currentDance, x: xPct, y: yPct }]
            }
            return prev
          })
        }
        setDraggingMember(null)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingMember, dragOffset, currentDance])

  const handleSidebarDrop = (userId: string, e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const xPct = pixelToPercent(e.clientX - rect.left)
    const yPct = pixelToPercent(e.clientY - rect.top)

    setPositions((prev) => {
      if (prev.find((p) => p.userId === userId)) return prev
      if (currentDance) {
        return [...prev, { userId, danceName: currentDance, x: xPct, y: yPct }]
      }
      return prev
    })
  }

  const removeFromCanvas = (userId: string) => {
    setPositions((prev) => prev.filter((p) => p.userId !== userId))
    setSelectedOnCanvas(null)
  }

  const handleAddDance = () => {
    const name = newDanceName.trim()
    if (!name || dances.includes(name)) return
    setDances((prev) => [...prev, name])
    setCurrentDance(name)
    setNewDanceName('')
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const currentPositions = positions.filter(p => p.danceName === currentDance)
      await api.post(`/events/${id}/stage`, currentPositions)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-bg')) {
      setSelectedOnCanvas(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregant escenari...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <BackButton to={`/esdeveniment/${id}`} />

      <div className="container mx-auto px-4 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">
            {event?.nom || 'Dissenyador d\'escenari'}
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {dances.map((dance) => (
                <button
                  key={dance}
                  onClick={() => setCurrentDance(dance)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentDance === dance
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {dance}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="text"
                  value={newDanceName}
                  onChange={(e) => setNewDanceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDance()}
                  placeholder="Nou ball..."
                  className="w-28 rounded-md border bg-background px-2 py-1 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleAddDance}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {canEdit && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="mr-1 h-4 w-4" />
                {saving ? 'Desant...' : 'Desar'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-56 shrink-0">
            <div className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Sense posar ({unplacedMembers.length})
                <button
                  onClick={toggleAll}
                  className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {allExpanded ? 'Replegar' : 'Desplegar'}
                </button>
              </div>
              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {unplacedMembers.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Tots els membres estan colocats
                  </p>
                )}

                {Object.entries(groupedUnplaced).map(([groupName, members]) => {
                  if (members.length === 0 && !groupName) return null
                  if (members.length === 0 && groupName) return null
                  const hasSubs = groupName && roleGroups[groupName]?.length > 0
                  const isExpanded = !groupName || !hasSubs || expandedGroups.has(groupName)

                  return (
                    <div key={groupName || 'sense-rol'}>
                      {groupName && hasSubs && (
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="flex items-center gap-1 w-full text-[11px] font-bold uppercase tracking-wider text-primary py-1"
                        >
                          {expandedGroups.has(groupName) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {groupName} ({members.length})
                        </button>
                      )}
                      {groupName && !hasSubs && (
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary py-1">
                          {groupName} ({members.length})
                        </p>
                      )}
                      {!groupName && (
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-1">
                          Sense rol ({members.length})
                        </p>
                      )}

                      {isExpanded && members.map((member) => {
                        const userId = getMemberUserId(member)
                        const isDragging = draggingMember === userId
                        return (
                          <div
                            key={userId}
                            onMouseDown={(e) => handleMouseDown(userId, e)}
                            className={`flex items-center gap-2 rounded-md border bg-secondary/50 px-2.5 py-1.5 text-sm cursor-grab select-none transition-opacity mb-1 ${
                              isDragging ? 'opacity-40' : 'hover:bg-secondary'
                            }`}
                          >
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <span className="truncate block">{getMemberName(member)}</span>
                              {getMemberRole(member) && (
                                <span className="text-[10px] text-primary font-medium block truncate">{getMemberRole(member)}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              ESCENARI
            </p>

            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="relative w-full max-w-[800px] overflow-hidden rounded-lg border-2 border-border"
              style={{
                aspectRatio: '4 / 3',
                background: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundColor: '#f4f4f5',
              }}
            >
              <div className="canvas-bg absolute inset-0" />

              {positions.map((pos) => {
                const reg = registrations.find((r) => getMemberUserId(r) === pos.userId)
                if (!reg) return null
                const name = getMemberName(reg)
                const role = getMemberRole(reg)
                const left = percentToPixel(pos.x)
                const top = percentToPixel(pos.y)
                const isSelected = selectedOnCanvas === pos.userId
                const isDragging = draggingMember === pos.userId

                return (
                  <div
                    key={pos.userId}
                    className={`absolute flex flex-col items-center select-none ${
                      isDragging ? 'z-20' : 'z-10'
                    }`}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromCanvas(pos.userId)
                        }}
                        className="absolute -top-2 -right-2 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div
                      onMouseDown={(e) => handleMouseDown(pos.userId, e)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md cursor-grab"
                    >
                      {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="mt-0.5 max-w-[80px] truncate text-center text-[10px] font-medium leading-tight text-foreground drop-shadow-sm">
                      {name}
                    </span>
                    {role && (
                      <span className="max-w-[80px] truncate text-center text-[9px] leading-tight text-primary font-semibold">
                        {role}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              PÚBLIC
            </p>

            <p className="text-xs text-muted-foreground">
              {positions.length} colocats · {unplacedMembers.length} sense posar
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
