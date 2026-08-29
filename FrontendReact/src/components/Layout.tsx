import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8" style={{ paddingBottom: '6rem' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
