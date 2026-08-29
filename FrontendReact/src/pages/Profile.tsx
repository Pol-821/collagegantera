import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, Lock, Save, CheckCircle, Camera, Bell, Trash, AlertTriangle } from 'lucide-react'
import BackButton from '@/components/BackButton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function Profile() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ nom: '', cognoms: '', dataNaixement: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [error, setError] = useState('')
  const [pwError, setPwError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(0)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [notifLoading, setNotifLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    api.get('/auth/profile').then((res) => {
      setForm({
        nom: res.data.nom || '',
        cognoms: res.data.cognoms || '',
        dataNaixement: res.data.dataNaixement ? res.data.dataNaixement.split('T')[0] : '',
      })
      if (res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl)
      setNotificationsEnabled(res.data.notificationsEnabled !== false)
    })
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const newUrl = res.data.avatarUrl
      setAvatarUrl(newUrl)
      setAvatarCacheBuster(Date.now())
      const updatedUser = { ...user, avatarUrl: newUrl }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      await refreshUser()
      setSuccess('Foto de perfil actualitzada.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al pujar la foto.')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/auth/profile', {
        nom: form.nom,
        cognoms: form.cognoms,
        dataNaixement: form.dataNaixement || null,
      })
      setSuccess('Perfil actualitzat correctament.')
      setTimeout(() => setSuccess(''), 3000)
      await refreshUser()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualitzar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError('Les contrasenyes noves no coincideixen.')
      setPwLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPwError('La contrasenya ha de tenir com a minim 6 caracters.')
      setPwLoading(false)
      return
    }

    try {
      await api.put('/auth/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPwSuccess('Contrasenya canviada correctament.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwSuccess(''), 3000)
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Error al canviar la contrasenya.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleNotificationsToggle = async () => {
    setNotifLoading(true)
    try {
      const newValue = !notificationsEnabled
      await api.put('/auth/profile/notifications', { enabled: newValue })
      setNotificationsEnabled(newValue)
      const updatedUser = { ...user, notificationsEnabled: newValue }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch {
    } finally {
      setNotifLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Introdueix la teva contrasenya per confirmar.')
      return
    }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await api.delete('/auth/profile', { data: { password: deletePassword } })
      logout()
      navigate('/login')
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Error al eliminar el compte.')
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">El Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">Gestiona les teves dades personals</p>
        </div>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer group shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={`${avatarUrl}?t=${avatarCacheBuster}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {user?.nom?.[0] || '?'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  {uploadingAvatar ? 'Pujant...' : 'Canviar foto'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG o GIF.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dades Personals
            </CardTitle>
            <CardDescription>Actualitza el teu nom i cognoms</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              {success && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {success}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={form.nom}
                    onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cognoms">Cognoms</Label>
                  <Input
                    id="cognoms"
                    value={form.cognoms}
                    onChange={(e) => setForm(prev => ({ ...prev, cognoms: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correu electronic</Label>
                <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">L'email no es pot canviar.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNaixement">Data de Naixement</Label>
                <Input
                  id="dataNaixement"
                  type="date"
                  value={form.dataNaixement}
                  onChange={(e) => setForm(prev => ({ ...prev, dataNaixement: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Desant...' : 'Desar Canvis'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Canviar Contrasenya
            </CardTitle>
            <CardDescription>Assegura't que la nova contrasenya sigui robusta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {pwSuccess}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contrasenya Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Contrasenya</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Contrasenya</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={pwLoading}>
                  <Lock className="w-4 h-4 mr-2" />
                  {pwLoading ? 'Canviant...' : 'Canviar Contrasenya'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificacions
            </CardTitle>
            <CardDescription>Activa o desactiva les notificacions push al mòbil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificacions push</p>
                <p className="text-sm text-muted-foreground">
                  {notificationsEnabled
                    ? 'Rebràs notificacions al dispositiu mòbil.'
                    : 'No rebràs notificacions push.'}
                </p>
              </div>
              <button
                onClick={handleNotificationsToggle}
                disabled={notifLoading}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  notificationsEnabled ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash className="w-5 h-5" />
              Eliminar Compte
            </CardTitle>
            <CardDescription>
              Elimina el teu compte i totes les teves dades de forma permanent. Aquesta acció no es pot desfer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash className="w-4 h-4 mr-2" />
              Eliminar el meu compte
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); setDeletePassword(''); setDeleteError(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Compte
            </DialogTitle>
            <DialogDescription>
              Aquesta acció eliminarà permanentment el teu compte, les teves dades i no es pot desfer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {deleteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{deleteError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Introdueix la teva contrasenya per confirmar</Label>
              <Input
                id="deletePassword"
                type="password"
                placeholder="Contrasenya"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel·la</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading || !deletePassword.trim()}>
              {deleteLoading ? 'Eliminant...' : 'Eliminar Compte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
