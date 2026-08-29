import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
import type { Photo, Event } from '@/types'
import { Camera, Upload, ArrowLeft, Trash2, Pencil } from 'lucide-react'
import BackButton from '@/components/BackButton'

type GalleryView = 'years' | 'events' | 'photos'

export default function Gallery() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<GalleryView>('years')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadEventId, setUploadEventId] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [deleteDialogPhoto, setDeleteDialogPhoto] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canUpload = user?.roles?.some(r => ['Admin', 'Fotograf', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))
  const canDelete = user?.roles?.some(r => ['Admin', 'Fotograf', 'OrganitzadorTrobades'].includes(r))

  useEffect(() => {
    Promise.all([
      api.get('/photos').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
    ]).then(([photosRes, eventsRes]) => {
      setPhotos(Array.isArray(photosRes.data) ? photosRes.data : photosRes.data.data || [])
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const years = [...new Set(photos.map((p) => p.year))].sort((a, b) => b - a)

  const photosByEvent = (year: number, eventId?: string) => {
    let filtered = photos.filter((p) => p.year === year)
    if (eventId) filtered = filtered.filter((p) => p.eventId === eventId)
    return filtered
  }

  const eventsWithPhotos = (year: number) => {
    const eventIds = new Set(photos.filter((p) => p.year === year).map((p) => p.eventId))
    return events.filter((e) => eventIds.has(String(e.id)))
  }

  const handleUpload = async () => {
    if (!uploadEventId || !fileInputRef.current?.files?.length) return
    const file = fileInputRef.current.files[0]
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await api.post(`/gallery/upload/${uploadEventId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = uploadRes.data.url
      const year = new Date().getFullYear()
      await api.post('/photos', {
        eventId: uploadEventId,
        url: url,
        description: uploadDescription || undefined,
        year: year,
      })
      const newPhoto: Photo = {
        id: crypto.randomUUID(),
        eventId: uploadEventId,
        url,
        description: uploadDescription || undefined,
        uploadedById: user?.id || '',
        uploadedAt: new Date().toISOString(),
        year,
      }
      setPhotos((prev) => [newPhoto, ...prev])
      setUploadDialogOpen(false)
      setUploadEventId('')
      setUploadDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {} finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!deleteDialogPhoto) return
    setDeleting(true)
    try {
      await api.delete(`/photos/${deleteDialogPhoto.id}`)
      setPhotos((prev) => prev.filter((p) => p.id !== deleteDialogPhoto.id))
      setDeleteDialogPhoto(null)
    } catch (err: any) {
      console.error("Error eliminant foto:", err)
    } finally {
      setDeleting(false)
    }
  }

  const selectYear = (year: number) => {
    setSelectedYear(year)
    setView('events')
  }

  const selectEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setView('photos')
  }

  const goBack = () => {
    if (view === 'photos') {
      setView('events')
      setSelectedEventId(null)
    } else if (view === 'events') {
      setView('years')
      setSelectedYear(null)
    }
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {view !== 'years' && (
              <Button variant="ghost" size="icon" onClick={goBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Camera className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Galeria</h1>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && view === 'photos' && (
              <Button
                variant={editMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Pencil className="mr-1 h-4 w-4" />
                {editMode ? 'Sortir edició' : 'Mode edició'}
              </Button>
            )}
            {canUpload && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-1 h-4 w-4" /> Pujar fotos
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Pujar fotos</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Esdeveniment</Label>
                      <Select value={uploadEventId} onValueChange={setUploadEventId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un esdeveniment" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Arxiu d'imatge</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uploadDesc">Descripcio</Label>
                      <Input
                        id="uploadDesc"
                        placeholder="Descripcio de les fotos"
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel·la</Button>
                    <Button onClick={handleUpload} disabled={!uploadEventId || uploading}>
                      {uploading ? 'Pujant...' : 'Pujar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregant galeria...</p>
        ) : view === 'years' ? (
          years.length === 0 ? (
            <p className="text-muted-foreground">No hi ha fotos disponibles.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {years.map((year) => (
                <Card
                  key={year}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => selectYear(year)}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">{year}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">
                      {photos.filter((p) => p.year === year).length} fotos
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : view === 'events' && selectedYear ? (
          (() => {
            const evts = eventsWithPhotos(selectedYear)
            return evts.length === 0 ? (
              <p className="text-muted-foreground">No hi ha esdeveniments amb fotos per al {selectedYear}.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {evts.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => selectEvent(String(event.id))}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{event.nom}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {photosByEvent(selectedYear, String(event.id)).length} fotos
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })()
        ) : view === 'photos' && selectedYear && selectedEventId ? (
          (() => {
            const eventPhotos = photosByEvent(selectedYear, selectedEventId)
            return eventPhotos.length === 0 ? (
              <p className="text-muted-foreground">No hi ha fotos per aquest esdeveniment.</p>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                {eventPhotos.map((photo) => (
                  <div key={photo.id} className="break-inside-avoid">
                    <Card className="overflow-hidden group relative">
                      <img
                        src={photo.url}
                        alt={photo.description || 'Foto'}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                      {editMode && (
                        <button
                          className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-white rounded-full p-1.5 shadow-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialogPhoto(photo)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {photo.description && (
                        <CardContent className="p-2">
                          <p className="text-xs text-muted-foreground">{photo.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            )
          })()
        ) : null}
      </div>

      <Dialog open={!!deleteDialogPhoto} onOpenChange={() => setDeleteDialogPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar foto</DialogTitle>
            <DialogDescription>
              Estàs segur que vols eliminar aquesta foto? Aquesta acció és irreversible.
            </DialogDescription>
          </DialogHeader>
          {deleteDialogPhoto && (
            <div className="flex justify-center">
              <img
                src={deleteDialogPhoto.url}
                alt="Foto a eliminar"
                className="max-h-48 rounded-lg object-cover"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogPhoto(null)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDeletePhoto} disabled={deleting}>
              {deleting ? 'Eliminant...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
