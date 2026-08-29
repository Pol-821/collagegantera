import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import type { Event } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { MapPin, Users, LayoutGrid, Shield, Save, Pencil, Trash } from 'lucide-react'
import BackButton from '@/components/BackButton'
import EventGalleryInline from '@/components/EventGalleryInline'

interface Registration {
  id: string
  userId: string
  nom: string
  cognoms: string
  email: string
  registeredAt: string
  assignedRole?: string
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const canEdit = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))
  const [event, setEvent] = useState<Event | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [roleGroups, setRoleGroups] = useState<Record<string, string[]>>({})
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({})
  const [savingRoles, setSavingRoles] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', descripcio: '', lloc: '', tipus: '0' })
  const [deleteOpen, setDeleteOpen] = useState(false)

  const eventPassed = event ? new Date(event.dataHora) < new Date() : false

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !isAuthenticated) return
    api.get(`/events/${id}/registration`)
      .then((res) => setIsRegistered(res.data.registered || false))
      .catch((err) => console.error("API Error:", err))
  }, [id, isAuthenticated])

  const loadRegistrations = () => {
    if (!id) return
    api.get(`/events/${id}/registrations`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        setRegistrations(list)
        const edits: Record<string, string> = {}
        list.forEach((r: Registration) => { if (r.assignedRole) edits[r.userId] = r.assignedRole })
        setRoleEdits(edits)
      })
      .catch((err) => console.error("API Error:", err))
  }

  useEffect(() => { loadRegistrations() }, [id])

  useEffect(() => {
    api.get('/settings/role-groups')
      .then((res) => setRoleGroups(res.data))
      .catch((err) => console.error("API Error:", err))
  }, [])

  const handleSaveRoles = async () => {
    if (!id) return
    setSavingRoles(true)
    try {
      const updates = Object.entries(roleEdits).map(([userId, role]) => ({ UserId: userId, Role: role || null }))
      await api.put(`/events/${id}/registration/roles`, updates)
      loadRegistrations()
    } catch {} finally {
      setSavingRoles(false)
    }
  }

  const openEdit = () => {
    if (!event) return
    setEditForm({
      nom: event.nom,
      descripcio: event.descripcio || '',
      lloc: event.lloc || '',
      tipus: String(event.tipus) === '0' || String(event.tipus) === 'Assaig' ? '0' : '1',
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!id || !event) return
    try {
      await api.put(`/events/${id}`, {
        Nom: editForm.nom,
        DataHora: event.dataHora,
        Descripcio: editForm.descripcio,
        Lloc: editForm.lloc,
        Latitud: event.latitud || 0,
        Longitud: event.longitud || 0,
        MaterialImprescindible: event.materialImprescindible || '',
        Normes: event.normes || '',
        Tipus: parseInt(editForm.tipus),
      })
      setEditOpen(false)
      const res = await api.get(`/events/${id}`)
      setEvent(res.data)
    } catch {}
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await api.delete(`/events/${id}`)
      navigate('/esdeveniments')
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregant esdeveniment...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Esdeveniment no trobat.</p>
      </div>
    )
  }

  return (
    <div>
      <BackButton to="/esdeveniments" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{event.nom}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
              <Badge variant="secondary">{String(event.tipus) === '0' || String(event.tipus) === 'Assaig' ? 'Assaig' : 'Trobada'}</Badge>
              {(event.inscrits !== undefined || registrations.length > 0) && (
                <span className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4" /> {event.inscrits ?? registrations.length} inscrits
                </span>
              )}
              <span className="text-sm">{formatDateTime(event.dataHora)}</span>
              {event.lloc && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" /> {event.lloc}
                </span>
              )}
            </div>
          </div>
          {isAuthenticated && !eventPassed && (
            <div className="flex items-center gap-2">
              <Button variant={isRegistered ? 'outline' : 'default'} onClick={() => navigate(`/esdeveniment/${id}/inscripcio`)}>
                {isRegistered ? "Editar inscripció" : "Inscriure's"}
              </Button>
              {canEdit && (
                <>
                  <Button variant="outline" onClick={() => navigate(`/esdeveniment/${id}/escenari`)}>
                    <LayoutGrid className="mr-1 h-4 w-4" /> Escenari
                  </Button>
                  <Button variant="outline" onClick={openEdit}>
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="outline" onClick={() => setDeleteOpen(true)} className="text-red-600 hover:text-red-700">
                    <Trash className="mr-1 h-4 w-4" /> Eliminar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="detalls">
          <TabsList>
            <TabsTrigger value="detalls">Detalls</TabsTrigger>
            <TabsTrigger value="inscrits">Inscrits ({event.inscrits ?? registrations.length})</TabsTrigger>
            {canEdit && <TabsTrigger value="rols"><Shield className="mr-1 h-3.5 w-3.5" />Rols</TabsTrigger>}
            {event.materialImprescindible && <TabsTrigger value="material">Material</TabsTrigger>}
            <TabsTrigger value="galeria">Galeria</TabsTrigger>
          </TabsList>

          <TabsContent value="detalls">
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4 whitespace-pre-wrap text-sm">
                  {event.descripcio || 'No hi ha descripció disponible.'}
                </p>
                {event.lloc && (
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-medium">Ubicació</h3>
                    <iframe
                      title="Ubicació a Google Maps"
                      className="h-64 w-full rounded-md border"
                      src={`https://www.google.com/maps?q=${event.latitud && event.longitud ? `${event.latitud},${event.longitud}` : encodeURIComponent(event.lloc)}&output=embed`}
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inscrits">
            <Card>
              <CardContent className="pt-6">
                {registrations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Encara no hi ha inscrits.</p>
                ) : (
                  <ul className="space-y-3">
                    {registrations.map((reg) => (
                      <li key={reg.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {reg.nom?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{reg.nom} {reg.cognoms}</p>
                            <p className="text-xs text-muted-foreground">{reg.email}</p>
                          </div>
                        </div>
                        {reg.assignedRole && <Badge variant="outline">{reg.assignedRole}</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canEdit && (
            <TabsContent value="rols">
              <Card>
                <CardContent className="pt-6">
                  {registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hi ha inscrits per assignar rols.</p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {registrations.map((reg) => (
                          <div key={reg.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {reg.nom?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{reg.nom} {reg.cognoms}</p>
                              <p className="text-xs text-muted-foreground">{reg.email}</p>
                            </div>
                            <Select
                              value={roleEdits[reg.userId] || ''}
                              onValueChange={(value) => setRoleEdits(prev => ({ ...prev, [reg.userId]: value }))}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Sense rol" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(roleGroups).map(([groupName, subs]) => (
                                  subs.length > 0 ? (
                                    <SelectGroup key={groupName}>
                                      <SelectLabel>{groupName}</SelectLabel>
                                      <SelectItem value={groupName}>{groupName}</SelectItem>
                                      {subs.map((sub) => (
                                        <SelectItem key={`${groupName}-${sub}`} value={`${groupName} - ${sub}`}>{sub}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ) : (
                                    <SelectItem key={groupName} value={groupName}>{groupName}</SelectItem>
                                  )
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button onClick={handleSaveRoles} disabled={savingRoles}>
                          <Save className="mr-1 h-4 w-4" />
                          {savingRoles ? 'Desant...' : 'Desar rols'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {event.materialImprescindible && (
            <TabsContent value="material">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm whitespace-pre-wrap">{event.materialImprescindible}</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="galeria">
            <Card>
              <CardContent className="pt-6">
                <EventGalleryInline eventId={id!} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar esdeveniment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={editForm.nom} onChange={(e) => setEditForm(prev => ({ ...prev, nom: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tipus</Label>
              <Select value={editForm.tipus} onValueChange={(v) => setEditForm(prev => ({ ...prev, tipus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Assaig</SelectItem>
                  <SelectItem value="1">Trobada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripció</Label>
              <Input value={editForm.descripcio} onChange={(e) => setEditForm(prev => ({ ...prev, descripcio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Lloc</Label>
              <Input value={editForm.lloc} onChange={(e) => setEditForm(prev => ({ ...prev, lloc: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel·la</Button>
            <Button onClick={handleSaveEdit}>Desar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar esdeveniment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Estàs segur que vols eliminar <span className="font-semibold text-foreground">{event?.nom}</span>? Aquesta acció no es pot desfer i s'eliminaran totes les inscripcions associades.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
