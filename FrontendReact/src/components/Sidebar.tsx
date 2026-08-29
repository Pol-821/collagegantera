import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCollaSettings } from '@/contexts/CollaSettingsContext'
import { cn } from '@/lib/utils'
import {
  ShieldCheck,
  Bell,
  Image,
  Settings,
  User,
  LogOut,
  Users,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const menuItems = [
  { to: '/anuncis', label: 'Anuncis', icon: Bell },
  { to: '/galeria', label: 'Galeria', icon: Image },
  { to: '/familia', label: 'Família', icon: Users },
  { to: '/perfil', label: 'El Meu Perfil', icon: User },
]

const adminItems = [
  { to: '/admin/rols', label: 'Gestió de Rols', icon: ShieldCheck },
  { to: '/admin/configuracio', label: 'Configuració', icon: Settings },
]

const organizerItems = [
  { to: '/organitzacio/rols-esdeveniment', label: "Rols d'Esdeveniment", icon: ShieldCheck },
]

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { collaName, logoUrl } = useCollaSettings()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded object-cover" />
            ) : (
              <Users className="w-6 h-6 text-primary" />
            )}
            {collaName}
          </SheetTitle>
        </SheetHeader>

        {isAuthenticated && user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user.nom?.[0]}{user.cognoms?.[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{user.nom} {user.cognoms}</p>
                <p className="text-xs text-muted-foreground truncate">{user.roles?.join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {isAuthenticated && menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}

          {isAuthenticated && user?.roles?.includes('Admin') && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administració</p>
              </div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          {isAuthenticated && user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r)) && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organització</p>
              </div>
              {organizerItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          {isAuthenticated && (
            <div className="pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Tancar sessió
              </Button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground text-center">
          {collaName} © 2026
        </div>
      </SheetContent>
    </Sheet>
  )
}
