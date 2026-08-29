import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCollaSettings } from '@/contexts/CollaSettingsContext'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Calendar, CalendarDays, Bell, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Esdeveniments',
    description: 'Gestiona tots els esdeveniments de la colla en un sol lloc.',
  },
  {
    icon: CalendarDays,
    title: 'Calendari',
    description: 'Visualitza les activitats properes al calendari.',
  },
  {
    icon: BarChart3,
    title: 'Enquestes',
    description: 'Crea i vota en enquestes per prendre decisions consensuades.',
  },
  {
    icon: Bell,
    title: 'Notificacions',
    description: 'Rep avisos importants mai et perdis cap activitat.',
  },
]

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const { collaName } = useCollaSettings()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <h1 className="text-2xl font-bold">{collaName}</h1>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Iniciar Sessió</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Registrar-se</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-4 text-5xl font-bold tracking-tight">
            {collaName}
          </h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Gestió integral de la colla
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/login">Iniciar Sessió</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register">Registrar-se</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {collaName}. Tots els drets reservats.
      </footer>
    </div>
  )
}
