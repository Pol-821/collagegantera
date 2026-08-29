export interface User {
  id: string
  email: string
  nom: string
  cognoms: string
  nomFamilia?: string
  avatarUrl?: string
  roles: string[]
  notificationsEnabled?: boolean
  isFamilyHead?: boolean
}

export interface Event {
  id: string
  nom: string
  descripcio?: string
  lloc?: string
  dataHora: string
  tipus: string
  latitud?: number
  longitud?: number
  materialImprescindible?: string
  normes?: string
  recurringPatternId?: string
  inscrits?: number
}

export interface MaterialItem {
  id: number
  nom: string
  quantitat: number
  assignatA?: string
  notes?: string
}

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  createdAt: string
  isRead: boolean
  userId: string
}

export interface Survey {
  id: string
  titol: string
  descripcio?: string
  options: string[]
  votes: Record<string, number>
  tancada: boolean
  dataCreacio: string
  dataTancament?: string
}

export interface LeaderboardEntry {
  nom: string
  cognoms: string
  totalAssistencies: number
  avatarUrl?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  authorId: string
  authorName?: string
  createdAt: string
  isPinned: boolean
  imageUrl?: string
}

export interface Photo {
  id: string
  eventId: string
  url: string
  description?: string
  uploadedById?: string
  uploadedAt: string
  year: number
  eventName?: string
}
