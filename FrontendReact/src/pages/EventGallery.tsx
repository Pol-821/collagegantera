import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Upload } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface GalleryImage {
  id: number
  url: string
  descripcio?: string
  dataPuja: string
}

export default function EventGallery() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  const isOrganizer = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/gallery/${id}`),
    ])
      .then(([eventRes, galleryRes]) => {
        setEvent(eventRes.data)
        const data = galleryRes.data
        setImages(Array.isArray(data) ? data : data.imatges || data.images || [])
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post(`/gallery/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const newImage = { id: Date.now(), url: res.data.url, dataPuja: new Date().toISOString() }
      setImages((prev) => [newImage, ...prev])
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregant galeria...</p>
      </div>
    )
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(`/esdeveniment/${id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Tornar
        </Button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Galeria</h1>
            {event && (
              <p className="text-muted-foreground">{event.nom} &middot; {formatDate(event.dataHora)}</p>
            )}
          </div>
          {isOrganizer && isAuthenticated && (
            <div>
              <input
                id="gallery-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button asChild>
                <label htmlFor="gallery-upload" className="cursor-pointer">
                  <Upload className="mr-1 h-4 w-4" /> Pujar foto
                </label>
              </Button>
            </div>
          )}
        </div>

        {images.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No hi ha fotos a la galeria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden">
                <div className="aspect-square">
                  <img
                    src={img.url}
                    alt={img.descripcio || 'Foto de la galeria'}
                    className="h-full w-full object-cover"
                  />
                </div>
                {img.descripcio && (
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{img.descripcio}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
