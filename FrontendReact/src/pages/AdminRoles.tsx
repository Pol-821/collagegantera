import { useState, useEffect } from 'react'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Save, Shield, Trash2, Plus, Users } from 'lucide-react'
import BackButton from '@/components/BackButton'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const ROLES = ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos', 'Fotograf', 'GeganterBase']

interface UserWithRoles {
  id: string
  nom: string
  cognoms: string
  email: string
  roles: string[]
}

interface NonAccountMember {
  id: string
  userId: string
  nom: string
  cognoms: string
  email?: string
  familyGroupId: string
}

export default function AdminRoles() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [nonAccountMembers, setNonAccountMembers] = useState<NonAccountMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleChanges, setRoleChanges] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [deleteDialogUser, setDeleteDialogUser] = useState<UserWithRoles | null>(null)
  const [deleteDialogMember, setDeleteDialogMember] = useState<NonAccountMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = () => {
    api.get('/roles/users')
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        if (err.response?.status === 403) {
          setError('No tens permisos per gestionar rols')
        } else {
          setError('Error en carregar els usuaris')
        }
      })
      .finally(() => setLoading(false))
  }

  const fetchNonAccountMembers = () => {
    api.get('/roles/non-account-members')
      .then((res) => setNonAccountMembers(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }

  useEffect(() => {
    fetchUsers()
    fetchNonAccountMembers()
  }, [])

  const getEffectiveRoles = (user: UserWithRoles): string[] => {
    return roleChanges[user.id] || user.roles || []
  }

  const toggleRole = (userId: string, role: string) => {
    setRoleChanges((prev) => {
      const current = prev[userId] || users.find((u) => u.id === userId)?.roles || []
      const next = new Set(current)
      if (next.has(role)) {
        next.delete(role)
      } else {
        next.add(role)
      }
      return { ...prev, [userId]: Array.from(next) }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      for (const [userId, newRoles] of Object.entries(roleChanges)) {
        const originalRoles = users.find((u) => u.id === userId)?.roles || []

        for (const role of newRoles) {
          if (!originalRoles.includes(role)) {
            await api.post('/roles/assign', { UserId: userId, Role: role })
          }
        }

        for (const role of originalRoles) {
          if (!newRoles.includes(role)) {
            await api.post('/roles/remove', { UserId: userId, Role: role })
          }
        }
      }
      setRoleChanges({})
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desar els canvis')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.keys(roleChanges).length > 0

  const handleDelete = async () => {
    if (!deleteDialogUser) return
    setDeleting(true)
    try {
      await api.delete(`/roles/users/${deleteDialogUser.id}`)
      setDeleteDialogUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al eliminar l'usuari")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!deleteDialogMember) return
    setDeleting(true)
    try {
      await api.delete(`/roles/non-account-members/${deleteDialogMember.id}`)
      setDeleteDialogMember(null)
      fetchNonAccountMembers()
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al eliminar el membre")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Gestió de Rols</h1>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {!error && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuaris i rols</CardTitle>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Desant...' : 'Desar canvis'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregant usuaris...</p>
            ) : (
              <div className="space-y-3">
                {users.map((u) => {
                  const effectiveRoles = getEffectiveRoles(u)
                  const isChanged = !!roleChanges[u.id]

                  return (
                    <div
                      key={u.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 ${
                        isChanged ? 'border-primary bg-accent/30' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{u.nom} {u.cognoms}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {effectiveRoles.length > 0 ? (
                            effectiveRoles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === 'Admin' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Sense rol</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="shrink-0">
                              <Plus className="h-4 w-4 mr-1" />
                              Rols
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Rols de {u.nom}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ROLES.map((role) => (
                              <DropdownMenuCheckboxItem
                                key={role}
                                checked={effectiveRoles.includes(role)}
                                onCheckedChange={() => toggleRole(u.id, role)}
                              >
                                {role}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => setDeleteDialogUser(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres sense compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nonAccountMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hi ha membres sense compte associat.</p>
          ) : (
            <div className="space-y-3">
              {nonAccountMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{m.nom} {m.cognoms}</p>
                    {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteDialogMember(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteDialogUser} onOpenChange={() => setDeleteDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar membre</DialogTitle>
            <DialogDescription>
              Estàs segur que vols eliminar <strong>{deleteDialogUser?.nom} {deleteDialogUser?.cognoms}</strong>?
              Aquesta acció és irreversible i eliminarà totes les seves dades associades.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogUser(null)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminant...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialogMember} onOpenChange={() => setDeleteDialogMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar membre sense compte</DialogTitle>
            <DialogDescription>
              Estàs segur que vols eliminar <strong>{deleteDialogMember?.nom} {deleteDialogMember?.cognoms}</strong>?
              Aquesta acció és irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogMember(null)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDeleteMember} disabled={deleting}>
              {deleting ? 'Eliminant...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
