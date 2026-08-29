import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { LeaderboardEntry, Notification } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Calendar, Users, Bell, Trophy } from 'lucide-react'

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return

    api.get('/events/upcoming').then((res) => {
      setUpcomingCount(Array.isArray(res.data) ? res.data.length : 0)
    }).catch((err) => console.error("API Error:", err))

    api.get('/attendance/leaderboard').then((res) => {
      const data = res.data
      setLeaderboard(Array.isArray(data) ? data : data.leaderboard || [])
      setMemberCount(data.totalMembers || 0)
    }).catch((err) => console.error("API Error:", err))

    api.get('/notifications').then((res) => {
      const data = Array.isArray(res.data) ? res.data : []
      setNotifications(data.slice(0, 5))
      setUnreadCount(data.filter((n: any) => !n.isRead).length)
    }).catch((err) => console.error("API Error:", err))
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Hola, {user?.nom} {user?.cognoms}
        </h1>
        <p className="text-muted-foreground">Benvingut/da al tauler de control</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Esdeveniments propers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notificacions sense llegir</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Classificació d'assistència
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.length === 0 && (
                <p className="text-sm text-muted-foreground">No hi ha dades disponibles.</p>
              )}
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {entry.nom} {entry.cognoms}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.totalAssistencies > 0 ? `${entry.totalAssistencies} assistències` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notificacions recents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/notificacions">Veure tot</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No hi ha notificacions.</p>
              )}
              {notifications.map((n: any) => (
                <div key={n.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
