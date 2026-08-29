import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    contrasenya: '',
    nom: '',
    cognoms: '',
    codiColla: '',
    nomFamilia: '',
  })
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!acceptPrivacy) {
      setError("Has d'acceptar la política de privacitat per registrar-te.")
      return
    }
    setLoading(true)
    try {
      await register({
        email: form.email,
        contrasenya: form.contrasenya,
        nom: form.nom,
        cognoms: form.cognoms,
        codiColla: form.codiColla,
        nomFamilia: form.nomFamilia || undefined,
      })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el registre')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Registrar-se</CardTitle>
          <CardDescription>Crea el teu compte a la Colla Gegantera</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correu electrònic</Label>
              <Input
                id="email"
                type="email"
                placeholder="correu@exemple.cat"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrasenya">Contrasenya</Label>
              <Input
                id="contrasenya"
                type="password"
                placeholder="••••••••"
                value={form.contrasenya}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Nom"
                  value={form.nom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognoms">Cognoms</Label>
                <Input
                  id="cognoms"
                  placeholder="Cognoms"
                  value={form.cognoms}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codiColla">Codi Colla</Label>
              <Input
                id="codiColla"
                placeholder="Codi d'accés de la colla"
                value={form.codiColla}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomFamilia">Nom de Família (opcional)</Label>
              <Input
                id="nomFamilia"
                placeholder="Nom de la família"
                value={form.nomFamilia}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="privacy"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 shrink-0"
              />
              <label htmlFor="privacy" className="text-muted-foreground">
                He llegit i accepto la{' '}
                <Link to="/politica-privacitat" target="_blank" className="text-primary underline-offset-4 hover:underline">
                  política de privacitat
                </Link>
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrant...' : 'Registrar-se'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Ja tens compte?{' '}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Iniciar Sessió
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
