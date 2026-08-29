import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Event, MaterialItem } from '@/types'
import { formatDate } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface assignableUser {
  id: string
  nom: string
  cognoms: string
}

export default function EventAssignments() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [material, setMaterial] = useState<MaterialItem[]>([])
  const [users, setUsers] = useState<assignableUser[]>([])
  const [loading, setLoading] = useState(true)

  const isOrganizer = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))

  useEffect(() => {
    if (!isAuthenticated || !isOrganizer) {
      navigate('/login')
      return
    }
    if (!id) return

    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/events/${id}/material`),
      api.get('/users'),
    ])
      .then(([eventRes, materialRes, usersRes]) => {
        setEvent(eventRes.data)
        setMaterial(Array.isArray(materialRes.data) ? materialRes.data : materialRes.data.data || [])
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [])
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [id, isAuthenticated, isOrganizer, navigate])

  const handleAssign = async (materialId: number, userId: string | undefined) => {
    if (!id) return
    try {
      if (userId) {
        await api.post(`/events/${id}/material/${materialId}/assign`, { userId })
      } else {
        await api.delete(`/events/${id}/material/${materialId}/assign`)
      }
      setMaterial((prev) =>
        prev.map((m) =>
          m.id === materialId
            ? { ...m, assignatA: userId ? users.find((u) => u.id === userId)?.nom : undefined }
            : m
        )
      )
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregant assignacions...</p>
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Assignacions de material</h1>
          {event && (
            <p className="text-muted-foreground">{event.nom} &middot; {formatDate(event.dataHora)}</p>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            {material.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hi ha material per a aquest esdeveniment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Material</th>
                      <th className="pb-2 font-medium">Quantitat</th>
                      <th className="pb-2 font-medium">Assignat a</th>
                      <th className="pb-2 font-medium">Accions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3">
                          <p className="font-medium">{item.nom}</p>
                          {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">x{item.quantitat}</Badge>
                        </td>
                        <td className="py-3">
                          {item.assignatA ? (
                            <Badge variant="secondary">{item.assignatA}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <select
                            className="rounded-md border bg-transparent px-2 py-1 text-sm"
                            value={item.assignatA ? users.find((u) => u.nom === item.assignatA)?.id || '' : ''}
                            onChange={(e) => handleAssign(item.id, e.target.value || undefined)}
                          >
                            <option value="">Sense assignar</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nom} {u.cognoms}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
