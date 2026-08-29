import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { MapPin, Plus, Users } from 'lucide-react'
import BackButton from '@/components/BackButton'

type TipusFilter = 'assaig' | 'trobada'

export default function Events() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [tipusFilter, setTipusFilter] = useState<TipusFilter>('assaig')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    nom: '',
    dataHora: '',
    descripcio: '',
    lloc: '',
    tipus: '0',
    materialImprescindible: '',
  })

  const canCreate = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))

  useEffect(() => {
    setLoading(true)
    api.get('/events')
      .then((res) => {
        setEvents(Array.isArray(res.data) ? res.data : res.data.data || [])
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [])

  const filteredEvents = events.filter((event) => {
    const t = String(event.tipus)
    const isAssaig = t === 'Assaig' || t === '0' || t === 'assajos' || t === 'assaig'
    const isTrobada = t === 'Trobada' || t === '1' || t === 'trobades' || t === 'trobada'
    return tipusFilter === 'assaig' ? isAssaig : isTrobada
  })

  const handleCreate = async () => {
    if (!newEvent.nom.trim() || !newEvent.dataHora) return
    try {
      const res = await api.post('/events', {
        Nom: newEvent.nom,
        DataHora: newEvent.dataHora,
        Descripcio: newEvent.descripcio || undefined,
        Lloc: newEvent.lloc || undefined,
        Tipus: Number(newEvent.tipus),
        MaterialImprescindible: newEvent.materialImprescindible || undefined,
      })
      setEvents((prev) => [res.data, ...prev])
      setNewEvent({ nom: '', dataHora: '', descripcio: '', lloc: '', tipus: '0', materialImprescindible: '' })
      setDialogOpen(false)
    } catch {}
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Esdeveniments</h1>
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Nou esdeveniment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nou esdeveniment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      placeholder="Nom de l'esdeveniment"
                      value={newEvent.nom}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, nom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataHora">Data i Hora</Label>
                    <Input
                      id="dataHora"
                      type="datetime-local"
                      value={newEvent.dataHora}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, dataHora: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcio">Descripció</Label>
                    <textarea
                      id="descripcio"
                      placeholder="Descripció de l'esdeveniment"
                      value={newEvent.descripcio}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, descripcio: e.target.value }))}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lloc">Lloc</Label>
                    <Input
                      id="lloc"
                      placeholder="Lloc de l'esdeveniment"
                      value={newEvent.lloc}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, lloc: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipus</Label>
                    <Select value={newEvent.tipus} onValueChange={(value) => setNewEvent((prev) => ({ ...prev, tipus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Assaig</SelectItem>
                        <SelectItem value="1">Trobada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      placeholder="Material necessari"
                      value={newEvent.materialImprescindible}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, materialImprescindible: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel·la</Button>
                  <Button onClick={handleCreate}>Crear</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={tipusFilter === 'assaig' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipusFilter('assaig')}
            >
              Assajos
            </Button>
            <Button
              variant={tipusFilter === 'trobada' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipusFilter('trobada')}
            >
              Trobades
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregant esdeveniments...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-muted-foreground">No hi ha esdeveniments d'aquest tipus.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/esdeveniment/${event.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.nom}</CardTitle>
                    <Badge variant="secondary">{String(event.tipus) === '0' || String(event.tipus) === 'Assaig' || String(event.tipus) === 'assaig' ? 'Assaig' : 'Trobada'}</Badge>
                  </div>
                  <CardDescription>{formatDate(event.dataHora)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {event.lloc && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.lloc}</span>
                      </div>
                    )}
                    {event.inscrits !== undefined && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{event.inscrits} inscrits</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}
