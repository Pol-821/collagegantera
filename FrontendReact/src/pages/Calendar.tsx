import { useState, useEffect, useMemo } from 'react'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Event } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface CalendarDay {
  date: Date
  events: Event[]
  isCurrentMonth: boolean
  isToday: boolean
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
]

const DAY_NAMES = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    setLoading(true)
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    api.get('/events', { params: { start, end } })
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [year, month])

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days: CalendarDay[] = []
    const totalDays = getDaysInMonth(year, month)
    const startDay = getFirstDayOfMonth(year, month)

    const prevMonthDays = getDaysInMonth(year, month - 1)
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      days.push({
        date,
        events: events.filter((e) => new Date(e.dataHora).toDateString() === date.toDateString()),
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
      })
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d)
      days.push({
        date,
        events: events.filter((e) => new Date(e.dataHora).toDateString() === date.toDateString()),
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      })
    }

    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d)
      days.push({
        date,
        events: events.filter((e) => new Date(e.dataHora).toDateString() === date.toDateString()),
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
      })
    }

    return days
  }, [year, month, events])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Calendari</h1>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle>{MONTH_NAMES[month]} {year}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {calendarDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-[60px] flex-col items-center rounded-md border p-1 text-sm transition-colors sm:min-h-[80px] ${
                    day.isCurrentMonth ? 'bg-background' : 'bg-muted/30 text-muted-foreground'
                  } ${
                    day.isToday ? 'border-primary font-bold' : ''
                  } ${
                    selectedDay?.date.toDateString() === day.date.toDateString()
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{day.date.getDate()}</span>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {day.events.slice(0, 3).map((ev, j) => (
                      <span
                        key={j}
                        className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2"
                        title={ev.nom}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedDay && selectedDay.events.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Esdeveniments del {selectedDay.date.getDate()} de {MONTH_NAMES[selectedDay.date.getMonth()]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedDay.events.map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{ev.nom}</p>
                      <p className="text-xs text-muted-foreground">{ev.tipus} &middot; {ev.lloc || 'Sense lloc'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {selectedDay && selectedDay.events.length === 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No hi ha esdeveniments per aquest dia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
