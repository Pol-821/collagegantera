import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import type { Survey } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, Check, Lock, Trash2 } from 'lucide-react'
import BackButton from '@/components/BackButton'

export default function Surveys() {
  const { user, isAuthenticated } = useAuth()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newSurvey, setNewSurvey] = useState({ titol: '', descripcio: '', options: ['', ''] })
  const [votedId, setVotedId] = useState<string | null>(null)

  const canCreate = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))

  useEffect(() => {
    api.get('/surveys')
      .then((res) => setSurveys(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    const validOptions = newSurvey.options.filter((o) => o.trim())
    if (!newSurvey.titol.trim() || validOptions.length < 2) return
    try {
      const res = await api.post('/surveys', {
        title: newSurvey.titol,
        description: newSurvey.descripcio || undefined,
        options: validOptions,
      })
      setSurveys((prev) => [res.data, ...prev])
      setNewSurvey({ titol: '', descripcio: '', options: ['', ''] })
      setDialogOpen(false)
    } catch {}
  }

  const handleVote = async (surveyId: string, option: string) => {
    try {
      await api.post('/surveys/' + surveyId + '/vote', { option })
      const res = await api.get('/surveys')
      setSurveys(Array.isArray(res.data) ? res.data : [])
      setVotedId(surveyId)
    } catch {}
  }

  const getTotalVotes = (survey: Survey) => Object.values(survey.votes).reduce((a, b) => a + b, 0)

  const handleClose = async (surveyId: string) => {
    try {
      await api.delete('/surveys/' + surveyId)
      setSurveys((prev) => prev.map((s) => s.id === surveyId ? { ...s, tancada: true } : s))
    } catch {}
  }

  const handleDelete = async (surveyId: string) => {
    try {
      await api.delete('/surveys/' + surveyId + '/permanent')
      setSurveys((prev) => prev.filter((s) => s.id !== surveyId))
    } catch {}
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Enquestes</h1>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Crear enquesta</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova enquesta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Títol</Label>
                  <Input placeholder="Títol de l'enquesta" value={newSurvey.titol} onChange={(e) => setNewSurvey(prev => ({ ...prev, titol: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Descripció (opcional)</Label>
                  <Input placeholder="Breu descripció" value={newSurvey.descripcio} onChange={(e) => setNewSurvey(prev => ({ ...prev, descripcio: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Opcions</Label>
                  {newSurvey.options.map((opt, i) => (
                    <Input key={i} placeholder={`Opció ${i + 1}`} value={opt} onChange={(e) => setNewSurvey(prev => ({ ...prev, options: prev.options.map((o, j) => j === i ? e.target.value : o) }))} />
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setNewSurvey(prev => ({ ...prev, options: [...prev.options, ''] }))}>
                    Afegir opció
                  </Button>
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

      {loading ? (
        <p className="text-muted-foreground">Carregant enquestes...</p>
      ) : surveys.length === 0 ? (
        <p className="text-muted-foreground">No hi ha enquestes disponibles.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => {
            const total = getTotalVotes(survey)
            return (
              <Card key={survey.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{survey.titol}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={survey.tancada ? 'secondary' : 'default'}>
                        {survey.tancada ? 'Tancada' : 'Activa'}
                      </Badge>
                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Eliminar enquesta"
                          onClick={() => handleDelete(survey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {survey.descripcio && <CardDescription>{survey.descripcio}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {survey.options.map((option) => {
                    const votes = survey.votes[option] || 0
                    const percent = total > 0 ? (votes / total) * 100 : 0
                    return (
                      <div key={option}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{option}</span>
                          <span className="text-muted-foreground">{votes} ({Math.round(percent)}%)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary transition-all" style={{ width: percent + '%' }} />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                  {survey.tancada ? (
                    <p className="text-xs text-muted-foreground">{total} vots · Creat el {formatDate(survey.dataCreacio)}</p>
                  ) : votedId === survey.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-primary"><Check className="h-4 w-4" /> Vot registrat</div>
                      {canCreate && (
                        <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleClose(survey.id)}>
                          <Lock className="mr-1 h-3 w-3" /> Tancar enquesta
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      {isAuthenticated ? (
                        <div className="flex flex-wrap gap-2">
                          {survey.options.map((option) => (
                            <Button key={option} variant="outline" size="sm" onClick={() => handleVote(survey.id, option)}>
                              {option}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Inicia sessió per votar</p>
                      )}
                      {canCreate && (
                        <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleClose(survey.id)}>
                          <Lock className="mr-1 h-3 w-3" /> Tancar
                        </Button>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
