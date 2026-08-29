import { useState, useEffect } from 'react'
import api from '@/services/api'

interface GalleryImage {
  id: number
  url: string
  description?: string
  uploadedAt: string
}

export default function EventGalleryInline({ eventId }: { eventId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/gallery/${eventId}`)
      .then((res) => {
        const data = res.data
        setImages(Array.isArray(data) ? data : data.imatges || data.images || [])
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregant galeria...</p>
  }

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">No hi ha fotos a la galeria.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((img) => (
        <div key={img.id} className="overflow-hidden rounded-md border">
          <div className="aspect-square">
            <img
              src={img.url}
              alt={img.description || 'Foto de la galeria'}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
