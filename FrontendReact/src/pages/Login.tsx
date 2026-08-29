import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [contrasenya, setContrasenya] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, contrasenya)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en iniciar sessió')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Iniciar Sessió</CardTitle>
          <CardDescription>Introdueix les teves credencials per accedir</CardDescription>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrasenya">Contrasenya</Label>
              <Input
                id="contrasenya"
                type="password"
                placeholder="••••••••"
                value={contrasenya}
                onChange={(e) => setContrasenya(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciant sessió...' : 'Iniciar Sessió'}
            </Button>
            <p className="text-sm text-muted-foreground">
              No tens compte?{' '}
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                Registrar-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
