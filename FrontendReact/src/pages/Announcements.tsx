import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Announcement } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, Pin, Megaphone, Pencil, Trash } from 'lucide-react'
import BackButton from '@/components/BackButton'

export default function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null)
  const [deletingAnn, setDeletingAnn] = useState<Announcement | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formPinned, setFormPinned] = useState(false)

  const canManage = user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r))

  useEffect(() => {
    api.get('/announcements')
      .then((res) => setAnnouncements(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [])

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleCreate = async () => {
    if (!formTitle.trim() || !formBody.trim()) return
    try {
      const res = await api.post('/announcements', {
        title: formTitle,
        body: formBody,
        isPinned: formPinned,
      })
      setAnnouncements((prev) => [res.data, ...prev])
      setFormTitle('')
      setFormBody('')
      setFormPinned(false)
      setDialogOpen(false)
    } catch {}
  }

  const openEdit = (ann: Announcement) => {
    setEditingAnn(ann)
    setFormTitle(ann.title)
    setFormBody(ann.body)
    setFormPinned(ann.isPinned)
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editingAnn || !formTitle.trim() || !formBody.trim()) return
    try {
      const res = await api.put(`/announcements/${editingAnn.id}`, {
        title: formTitle,
        body: formBody,
        isPinned: formPinned,
      })
      setAnnouncements((prev) => prev.map((a) => a.id === editingAnn.id ? res.data : a))
      setEditDialogOpen(false)
      setEditingAnn(null)
    } catch {}
  }

  const handleDelete = async () => {
    if (!deletingAnn) return
    try {
      await api.delete(`/announcements/${deletingAnn.id}`)
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingAnn.id))
      setDeleteDialogOpen(false)
      setDeletingAnn(null)
    } catch {}
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Anuncis</h1>
          </div>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Nou anunci
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nou anunci</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Títol</Label>
                    <Input
                      placeholder="Títol de l'anunci"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cos</Label>
                    <textarea
                      placeholder="Contingut de l'anunci"
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formPinned}
                      onCheckedChange={setFormPinned}
                    />
                    <Label>Fixat a dalt</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel·la</Button>
                  <Button onClick={handleCreate}>Publicar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregant anuncis...</p>
        ) : sortedAnnouncements.length === 0 ? (
          <p className="text-muted-foreground">No hi ha anuncis.</p>
        ) : (
          <div className="space-y-4">
            {sortedAnnouncements.map((ann) => (
              <Card key={ann.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{ann.title}</CardTitle>
                      {ann.isPinned && (
                        <Pin className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(ann)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => { setDeletingAnn(ann); setDeleteDialogOpen(true) }}>
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                        {formatDate(ann.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ann.imageUrl && (
                    <img
                      src={ann.imageUrl}
                      alt={ann.title}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{ann.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar anunci</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Títol</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cos</Label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formPinned} onCheckedChange={setFormPinned} />
              <Label>Fixat a dalt</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel·la</Button>
            <Button onClick={handleEdit}>Desar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar anunci</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Estàs segur que vols eliminar <span className="font-semibold text-foreground">{deletingAnn?.title}</span>? Aquesta acció no es pot desfer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
