import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Notification } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Bell, BellOff, Trash2 } from 'lucide-react'
import BackButton from '@/components/BackButton'

type FilterTab = 'totes' | 'no_llegides'

export default function Notifications() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<FilterTab>('totes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    api.get('/notifications')
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const markAsRead = async (n: Notification) => {
    try {
      await api.put(`/notifications/${n.id}/read`)
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      )
    } catch {}
  }

  const deleteNotification = async (n: Notification) => {
    try {
      await api.delete(`/notifications/${n.id}`)
      setNotifications((prev) => prev.filter((item) => item.id !== n.id))
    } catch {}
  }

  const displayNotifications = filter === 'no_llegides'
    ? notifications.filter((n) => !n.isRead)
    : notifications

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Notificacions</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === 'totes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('totes')}
          >
            Totes
          </Button>
          <Button
            variant={filter === 'no_llegides' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('no_llegides')}
          >
            Sense llegir
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregant notificacions...</p>
        ) : displayNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BellOff className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                {filter === 'no_llegides' ? 'No hi ha notificacions sense llegir.' : 'No hi ha notificacions.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {displayNotifications.map((n) => (
              <Card key={n.id} className={!n.isRead ? '' : 'opacity-60'}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.isRead && (
                        <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">Nova</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(n)}
                        title="Marcar com a llegida"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(n)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
