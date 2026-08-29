import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { Check, UserPlus, UserMinus, AlertCircle } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface FamilyMember {
  id: string
  nom: string
  cognoms: string
  email?: string
  isFamilyHead?: boolean
}

interface RegistrationResult {
  userId: string
  success: boolean
  message: string
}

export default function EventRegistration() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<RegistrationResult[]>([])

  const loadData = async () => {
    if (!id) return
    try {
      const [eventRes, familyRes, regsRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get('/family/members'),
        api.get(`/events/${id}/registrations`),
      ])
      setEvent(eventRes.data)

      const familyMembers: FamilyMember[] = Array.isArray(familyRes.data)
        ? familyRes.data
        : []
      setMembers(familyMembers)

      const registered = new Set<string>()
      const regs = Array.isArray(regsRes.data) ? regsRes.data : []
      regs.forEach((r: any) => registered.add(r.userId || r.UserId))
      setRegisteredIds(registered)
    } catch {}
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [id, isAuthenticated, user, navigate])

  const toggleMember = (memberId: string) => {
    if (registeredIds.has(memberId)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const handleBulkRegister = async () => {
    if (!id || selectedIds.size === 0) return
    setSubmitting(true)
    setResults([])
    try {
      const res = await api.post(`/events/${id}/registration/bulk`, {
        userIds: Array.from(selectedIds),
      })
      setResults(res.data)
      setSelectedIds(new Set())
      await loadData()
    } catch {}
    setSubmitting(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return
    try {
      await api.delete(`/events/${id}/registration/${memberId}`)
      await loadData()
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregant...</p>
      </div>
    )
  }

  const unregisteredMembers = members.filter((m) => !registeredIds.has(m.id))
  const registeredMembers = members.filter((m) => registeredIds.has(m.id))
  const eventPassed = event ? new Date(event.dataHora) < new Date() : false

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">Inscripció familiar</h1>
        {event && (
          <p className="mb-6 text-muted-foreground">
            {event.nom} &middot; {formatDate(event.dataHora)}
          </p>
        )}

        {results.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Resultats de la inscripció</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.userId} className="flex items-center gap-2 text-sm">
                    {r.success ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className={r.success ? 'text-green-700' : 'text-amber-700'}>
                      {r.message}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {registeredMembers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="h-5 w-5 text-green-600" />
                Inscrits ({registeredMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {registeredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {member.nom} {member.cognoms}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">Inscrit</Badge>
                    </div>
                    {!eventPassed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Treure de la inscripció"
                      >
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {eventPassed ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">L'esdeveniment ja ha començat. Ja no és possible inscriure-s'hi.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" />
                  Afegir membres ({unregisteredMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unregisteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tots els membres de la família ja estan inscrits.
                    </p>
                  ) : (
                    unregisteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                          selectedIds.has(member.id) ? 'bg-accent' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {member.nom} {member.cognoms}
                          </p>
                          {member.email && (
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          )}
                        </div>
                        <Button
                          variant={selectedIds.has(member.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleMember(member.id)}
                        >
                          {selectedIds.has(member.id) ? (
                            <><Check className="mr-1 h-4 w-4" /> Seleccionat</>
                          ) : (
                            'Seleccionar'
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedIds.size > 0 && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleBulkRegister} disabled={submitting}>
                  {submitting
                    ? 'Inscrivint...'
                    : `Inscriure ${selectedIds.size} membre${selectedIds.size > 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
