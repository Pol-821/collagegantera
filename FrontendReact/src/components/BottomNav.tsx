import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Home,
  CalendarDays,
  Calendar,
  BarChart3,
  User,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Inici', icon: Home },
  { to: '/esdeveniments', label: 'Esdeveniments', icon: CalendarDays },
  { to: '/calendari', label: 'Calendari', icon: Calendar },
  { to: '/enquestes', label: 'Enquestes', icon: BarChart3 },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{ backgroundColor: 'color-mix(in srgb, var(--color-card) 95%, transparent)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium transition-colors min-w-[48px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
