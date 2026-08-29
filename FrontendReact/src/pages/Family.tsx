import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Plus, Pencil, Trash, TreePine, Mail, Check, X, AlertTriangle, ArrowRight, LogOut, Crown } from 'lucide-react'
import BackButton from '@/components/BackButton'
import FamilyTree from '@/components/FamilyTree'
import type { FamilyMemberNode } from '@/components/FamilyTree'

const ROLE_OPTIONS = [
  'Avi', 'Àvia', 'Avi polític', 'Àvia política',
  'Pare', 'Mare', 'Sogre', 'Sogra', 'Tiet', 'Tieta',
  'Fill', 'Filla', 'Espòs/Esposa', 'Germà/Germana',
  'Cunyat', 'Cunyada', 'Cosí', 'Cosina',
  'Gendre', 'Nora',
  'Net', 'Neta', 'Net polític', 'Neta política',
]

interface FamilyMember {
  id: string
  nom: string
  cognoms: string
  avatarUrl?: string
  encryptedFamilyRole?: string
  isFamilyHead: boolean
}

interface FamilyRoleEntry {
  id: string
  userId: string
  role: string
  hasAccount: boolean
}

interface Invitation {
  id: string
  inviterName: string
  familyName: string
  role: string
  createdAt: string
}

interface MigrationMember {
  userId: string
  nom: string
  cognoms: string
  role: string
  email?: string
  hasAccount?: boolean
}

export default function Family() {
  const { user, refreshUser } = useAuth()
  const [familyName, setFamilyName] = useState('')
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [roles, setRoles] = useState<FamilyRoleEntry[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  // Add member dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addMode, setAddMode] = useState<'account' | 'noaccount'>('account')
  const [newMember, setNewMember] = useState({
    nom: '', cognoms: '', email: '', role: 'Fill',
  })

  // Edit member dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<FamilyMemberNode | null>(null)
  const [editForm, setEditForm] = useState({ nom: '', cognoms: '', role: '' })
  const [editIsHead, setEditIsHead] = useState(false)

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState('')

  // Link account dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkTargetId, setLinkTargetId] = useState<string | null>(null)
  const [linkEmail, setLinkEmail] = useState('')

  // Migration dialog
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false)
  const [migrationMembers, setMigrationMembers] = useState<MigrationMember[]>([])
  const [selectedMigrationIds, setSelectedMigrationIds] = useState<Set<string>>(new Set())
  const [migrationTargetGroupId, setMigrationTargetGroupId] = useState('')
  const [migrationSourceGroupId, setMigrationSourceGroupId] = useState('')
  const [migrationHasOtherAccounts, setMigrationHasOtherAccounts] = useState(true)
  const [migrationLoading, setMigrationLoading] = useState(false)

  // Leave family dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveNonAccountMembers, setLeaveNonAccountMembers] = useState<MigrationMember[]>([])
  const [selectedLeaveIds, setSelectedLeaveIds] = useState<Set<string>>(new Set())
  const [leaveLoading, setLeaveLoading] = useState(false)

  const isHead = user?.isFamilyHead === true

  // Transfer head dialog
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<{ id: string; nom: string; cognoms: string } | null>(null)

  const openTransferDialog = (member: { id: string; nom: string; cognoms: string }) => {
    setTransferTarget(member)
    setTransferDialogOpen(true)
  }

  const handleTransferHead = async () => {
    if (!transferTarget) return
    try {
      await api.post('/family/transfer-head', { targetUserId: transferTarget.id })
      setTransferDialogOpen(false)
      setTransferTarget(null)
      await refreshUser()
      loadFamily()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al transferir el cap de família.')
    }
  }

  useEffect(() => {
    loadFamily()
    loadInvitations()
  }, [])

  const loadFamily = () => {
    api.get('/family/my')
      .then((res) => {
        setFamilyName(res.data.familyGroup?.nomFamilia || 'La meva família')
        setMembers(res.data.members || [])
        setRoles(res.data.roles || [])
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }

  const loadInvitations = () => {
    api.get('/family/invitations')
      .then((res) => setInvitations(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("API Error:", err))
  }

  const getMemberRole = (userId: string) => {
    const m = members.find(m => m.id === userId)
    if (m?.isFamilyHead) return 'Cap de família'
    const r = roles.find(r => r.userId === userId)
    return r?.role || 'Desconegut'
  }

  const getMemberHasAccount = (userId: string) => {
    const r = roles.find(r => r.userId === userId)
    return r?.hasAccount || false
  }

  const buildTreeNodes = (): FamilyMemberNode[] => {
    return members.map(m => ({
      id: m.id,
      nom: m.nom,
      cognoms: m.cognoms,
      role: getMemberRole(m.id),
      isFamilyHead: m.isFamilyHead,
      hasAccount: getMemberHasAccount(m.id),
      avatarUrl: m.avatarUrl ?? null,
    }))
  }

  // Handlers
  const handleAddMember = async () => {
    if (addMode === 'account') {
      if (!newMember.email.trim()) return
      const emailLower = newMember.email.trim().toLowerCase()
      if (user && emailLower === (user.email || '').toLowerCase()) {
        toast.error("No et pots afegir a tu mateix a la família.")
        return
      }
      try {
        const res = await api.post('/family/member', {
          Role: newMember.role,
          HasAccount: true,
          Email: newMember.email,
        })
        toast.success(res.data?.message || 'Invitació enviada.')
        setNewMember({ nom: '', cognoms: '', email: '', role: 'Fill' })
        setAddDialogOpen(false)
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Error al enviar la invitació.'
        if (msg.includes("No s'ha trobat") || err.response?.status === 404) {
          toast.error("No existeix cap compte amb aquest correu electrònic. Demana-li que es registri primer.")
        } else {
          toast.error(msg)
        }
      }
    } else {
      if (!newMember.nom.trim()) return
      try {
        await api.post('/family/member', {
          Role: newMember.role,
          HasAccount: false,
          Nom: newMember.nom,
          Cognoms: newMember.cognoms,
        })
        toast.success('Membre familiar afegit.')
        setNewMember({ nom: '', cognoms: '', email: '', role: 'Fill' })
        setAddDialogOpen(false)
        loadFamily()
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error al afegir el membre.')
      }
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const res = await api.post(`/family/invitation/${invitationId}/accept`)
      const data = res.data

      if (data.needsMigration && data.nonAccountMembers?.length > 0) {
        setMigrationMembers(data.nonAccountMembers)
        setSelectedMigrationIds(new Set(data.nonAccountMembers.map((m: MigrationMember) => m.userId)))
        setMigrationTargetGroupId(data.newFamilyGroupId || '')
        setMigrationSourceGroupId(data.oldFamilyGroupId || '')
        setMigrationHasOtherAccounts(data.otherAccountMembersCount > 0)
        setMigrationDialogOpen(true)
      }

      await refreshUser()
      loadInvitations()
      loadFamily()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al acceptar.')
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await api.post(`/family/invitation/${invitationId}/reject`)
      loadInvitations()
    } catch {}
  }

  const handleMigration = async () => {
    setMigrationLoading(true)
    try {
      await api.post('/family/migrate', {
        targetFamilyGroupId: migrationTargetGroupId,
        sourceFamilyGroupId: migrationSourceGroupId,
        migrateMemberIds: Array.from(selectedMigrationIds),
      })
      setMigrationDialogOpen(false)
      await refreshUser()
      loadFamily()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en la migració.')
    } finally {
      setMigrationLoading(false)
    }
  }

  const handleMigrationSkip = async () => {
    setMigrationLoading(true)
    try {
      await api.post('/family/migrate', {
        targetFamilyGroupId: migrationTargetGroupId,
        sourceFamilyGroupId: migrationSourceGroupId,
        migrateMemberIds: [],
      })
      setMigrationDialogOpen(false)
      await refreshUser()
      loadFamily()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error en la migració.')
    } finally {
      setMigrationLoading(false)
    }
  }

  const toggleMigrationMember = (userId: string) => {
    setSelectedMigrationIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleEditMember = async () => {
    if (!editMember || !editForm.nom.trim()) return
    try {
      await api.put('/family/member', {
        UserId: editMember.id,
        Nom: editForm.nom,
        Cognoms: editForm.cognoms,
        Role: editForm.role,
      })
      setEditDialogOpen(false)
      setEditMember(null)
      loadFamily()
    } catch {}
  }

  const handleDeleteMember = async () => {
    if (!deleteTargetId) return
    try {
      await api.delete(`/family/member/${deleteTargetId}`)
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
      loadFamily()
    } catch {}
  }

  const handleLinkAccount = async () => {
    if (!linkTargetId || !linkEmail.trim()) return
    try {
      await api.post('/family/member/link', {
        Email: linkEmail,
        FamilyMemberUserId: linkTargetId,
      })
      setLinkDialogOpen(false)
      setLinkTargetId(null)
      setLinkEmail('')
      loadFamily()
    } catch {}
  }

  const openEditDialog = (member: FamilyMemberNode) => {
    setEditMember(member)
    setEditForm({ nom: member.nom, cognoms: member.cognoms, role: member.role })
    setEditIsHead(member.isFamilyHead)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (userId: string) => {
    const m = members.find(m => m.id === userId)
    setDeleteTargetId(userId)
    setDeleteTargetName(m ? `${m.nom} ${m.cognoms}` : '')
    setDeleteDialogOpen(true)
  }

  const openLinkDialog = (userId: string) => {
    setLinkTargetId(userId)
    setLinkEmail('')
    setLinkDialogOpen(true)
  }

  const handleOpenLeaveDialog = async () => {
    try {
      const res = await api.get('/family/migration-candidates')
      const nonAccount = Array.isArray(res.data) ? res.data : []
      setLeaveNonAccountMembers(nonAccount)
      setSelectedLeaveIds(new Set(nonAccount.map((m: MigrationMember) => m.userId)))
      setLeaveDialogOpen(true)
    } catch {
      setLeaveDialogOpen(true)
    }
  }

  const handleLeaveFamily = async () => {
    setLeaveLoading(true)
    try {
      await api.post('/family/leave', {
        migrateMemberIds: Array.from(selectedLeaveIds),
      })
      setLeaveDialogOpen(false)
      await refreshUser()
      await loadFamily()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al abandonar la família.')
    } finally {
      setLeaveLoading(false)
    }
  }

  const toggleLeaveMember = (userId: string) => {
    setSelectedLeaveIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  return (
    <div>
      <BackButton to="/dashboard" />

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Invitacions pendents ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">
                      {inv.inviterName} t'invita a la família "{inv.familyName}"
                    </p>
                    <p className="text-xs text-muted-foreground">Rol: {inv.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAcceptInvitation(inv.id)}>
                      <Check className="mr-1 h-4 w-4 text-green-600" /> Acceptar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectInvitation(inv.id)}>
                      <X className="mr-1 h-4 w-4 text-destructive" /> Rebutjar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">{familyName}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenLeaveDialog}>
            <LogOut className="mr-1 h-4 w-4" /> Abandonar família
          </Button>
          {isHead && (
            <Button onClick={() => { setAddDialogOpen(true); setAddMode('account') }}>
              <Plus className="mr-1 h-4 w-4" /> Afegir membre
            </Button>
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (open) setAddMode('account') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Afegir membre de família</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={addMode === 'account' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('account')}
                className="flex-1"
              >
                Té compte
              </Button>
              <Button
                variant={addMode === 'noaccount' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddMode('noaccount')}
                className="flex-1"
              >
                Sense compte
              </Button>
            </div>

            {addMode === 'account' ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Introdueix el correu electrònic de l'usuari. Rebrà una notificació per acceptar o rebutjar la invitació.
                </p>
                <div className="space-y-2">
                  <Label>Correu electrònic</Label>
                  <Input type="email" placeholder="email@exemple.com" value={newMember.email} onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input placeholder="Nom" value={newMember.nom} onChange={(e) => setNewMember(prev => ({ ...prev, nom: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Cognoms</Label>
                  <Input placeholder="Cognoms" value={newMember.cognoms} onChange={(e) => setNewMember(prev => ({ ...prev, cognoms: e.target.value }))} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Rol familiar</Label>
              <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel·la</Button>
            <Button onClick={handleAddMember}>
              {addMode === 'account' ? 'Enviar invitació' : 'Afegir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">Carregant família...</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">No hi ha membres de família registrats.</p>
      ) : (
        <>
          {/* Family Tree */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Arbre genealògic
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible p-0 sm:p-6">
              <FamilyTree
                members={buildTreeNodes()}
                currentUserId={user?.id}
                isHead={isHead}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onLinkAccount={openLinkDialog}
              />
            </CardContent>
          </Card>

          {/* Member list */}
          <Card>
            <CardHeader>
              <CardTitle>Llistat de membres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => {
                  const role = getMemberRole(member.id)
                  return (
                    <div key={member.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {member.nom?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{member.nom} {member.cognoms}</p>
                          <p className="text-xs text-muted-foreground">{role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isHead && !member.isFamilyHead && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog({
                              id: member.id,
                              nom: member.nom,
                              cognoms: member.cognoms,
                              role,
                              isFamilyHead: member.isFamilyHead,
                              hasAccount: getMemberHasAccount(member.id),
                              avatarUrl: member.avatarUrl ?? null,
                            })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(member.id)}>
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {isHead && !member.isFamilyHead && getMemberHasAccount(member.id) && (
                          <Button variant="ghost" size="sm" onClick={() => openTransferDialog({ id: member.id, nom: member.nom, cognoms: member.cognoms })} title="Transferir cap de família">
                            <Crown className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input placeholder="Nom" value={editForm.nom} onChange={(e) => setEditForm(prev => ({ ...prev, nom: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cognoms</Label>
              <Input placeholder="Cognoms" value={editForm.cognoms} onChange={(e) => setEditForm(prev => ({ ...prev, cognoms: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rol familiar</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))} disabled={editIsHead}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editIsHead && (
                <p className="text-xs text-muted-foreground">El rol de l'usuari de compte no es pot modificar.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel·la</Button>
            <Button onClick={handleEditMember}>Desar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar membre</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Estàs segur que vols eliminar <span className="font-semibold text-foreground">{deleteTargetName}</span> de la família? Aquesta acció no es pot desfer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDeleteMember}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Account Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular compte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Introduceix el correu electrònic de l'usuari al qual vols vincular aquest membre de família.
            </p>
            <div className="space-y-2">
              <Label>Correu electrònic</Label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel·la</Button>
            <Button onClick={handleLinkAccount}>Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migration Dialog */}
      <Dialog open={migrationDialogOpen} onOpenChange={(open) => { if (!migrationLoading) setMigrationDialogOpen(open) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Migrar membres de família
            </DialogTitle>
            <DialogDescription>
              Has acceptat una invitació a una altra família. Tens membres a l'antiga família que pots migrar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!migrationHasOtherAccounts && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Cap membre amb compte es quedarà a l'antiga família.</p>
                  <p className="mt-1">Si no migras cap membre, s'eliminaran automàticament tots els membres sense compte ja que no quedarà cap persona responsable al grup familiar.</p>
                </div>
              </div>
            )}

            {migrationHasOtherAccounts && (
              <p className="text-sm text-muted-foreground">
                Selecciona quins membres vols portar a la teva nova família. Els que no seleccionis es quedaran a l'antiga família.
              </p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {migrationMembers.map((m) => (
                <label
                  key={m.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMigrationIds.has(m.userId) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMigrationIds.has(m.userId)}
                    onChange={() => toggleMigrationMember(m.userId)}
                    className="h-4 w-4 rounded border-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.nom} {m.cognoms}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {migrationHasOtherAccounts && (
              <Button variant="outline" onClick={handleMigrationSkip} disabled={migrationLoading}>
                No migrar cap membre
              </Button>
            )}
            <Button onClick={handleMigration} disabled={migrationLoading}>
              {migrationLoading ? 'Migrant...' : `Migrar ${selectedMigrationIds.size} membre${selectedMigrationIds.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Family Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={(open) => { if (!leaveLoading) setLeaveDialogOpen(open) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Abandonar família
            </DialogTitle>
            <DialogDescription>
              Marxaràs de la família actual i es crearà una nova família amb tu com a cap.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {leaveNonAccountMembers.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Tens membres sense compte a la família actual. Selecciona quins vols portar a la teva nova família.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {leaveNonAccountMembers.map((m) => (
                    <label
                      key={m.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLeaveIds.has(m.userId) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeaveIds.has(m.userId)}
                        onChange={() => toggleLeaveMember(m.userId)}
                        className="h-4 w-4 rounded border-primary"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.nom} {m.cognoms}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
            {leaveNonAccountMembers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No tens membres sense compte. En sortir, et crearàs una nova família buida.
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)} disabled={leaveLoading} className="w-full sm:w-auto">
              Cancel·la
            </Button>
            <Button variant="destructive" onClick={handleLeaveFamily} disabled={leaveLoading} className="w-full sm:w-auto">
              {leaveLoading ? 'Marxant...' : `Abandonar família${selectedLeaveIds.size > 0 ? ` portant ${selectedLeaveIds.size} membre${selectedLeaveIds.size !== 1 ? 's' : ''}` : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Transfer Head Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Transferir cap de família
            </DialogTitle>
            <DialogDescription>
              Estàs segur que vols transferir el rol de cap de família a <strong>{transferTarget?.nom} {transferTarget?.cognoms}</strong>?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A partir d'ara, {transferTarget?.nom} serà l'administrador de la família i podrà afegir, editar i eliminar membres. Tu perdràs aquests permisos.
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)} className="w-full sm:w-auto">
              Cancel·la
            </Button>
            <Button onClick={handleTransferHead} className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white">
              Sí, transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
