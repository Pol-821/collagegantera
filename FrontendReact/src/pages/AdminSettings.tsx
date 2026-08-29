import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCollaSettings } from '@/contexts/CollaSettingsContext'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, Camera } from 'lucide-react'
import BackButton from '@/components/BackButton'

export default function AdminSettings() {
  const { user } = useAuth()
  const { updateSettings } = useCollaSettings()
  const isAdmin = user?.roles?.includes('Admin')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [collaName, setCollaName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#e63946')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoCacheBuster, setLogoCacheBuster] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const d = res.data
        setCollaName(d.collaName || '')
        setPrimaryColor(d.primaryColor || '#e63946')
        setLogoUrl(d.logoUrl || '')
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLogoUrl(res.data.logoUrl)
      setLogoCacheBuster(Date.now())
    } catch {}
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await api.put('/settings', {
        CollaName: collaName,
        PrimaryColor: primaryColor,
        LogoUrl: logoUrl,
      })
      const d = res.data
      updateSettings({
        collaName: d.collaName || collaName,
        primaryColor: d.primaryColor || primaryColor,
        logoUrl: d.logoUrl || logoUrl,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configuració</h1>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregant configuració...</p>
        ) : (
          <div className="grid gap-6 max-w-2xl">
            {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Configuració de la colla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="collaName">Nom de la colla</Label>
                  <Input
                    id="collaName"
                    placeholder="Nom de la colla"
                    value={collaName}
                    onChange={(e) => setCollaName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color base de la pàgina</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-input"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo / Foto de la colla</Label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <img
                        src={`${logoUrl}?t=${logoCacheBuster}`}
                        alt="Logo"
                        className="h-20 w-20 rounded-lg object-cover border cursor-pointer"
                        onClick={() => logoInputRef.current?.click()}
                      />
                    ) : (
                      <div
                        className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-accent"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Camera className="h-4 w-4 mr-1" />
                      {logoUrl ? 'Canviar logo' : 'Pujar logo'}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                  <Save className="mr-1 h-4 w-4" />
                  {saving ? 'Desant...' : saved ? 'Desat!' : 'Desar configuració'}
                </Button>
              </CardContent>
            </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
