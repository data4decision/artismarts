// app/admin-dashboard/layout.tsx
// This layout is now SERVER COMPONENT (no 'use client' at top)

import Sidebar from './Sidebar'
import ClientHeader from './ClientHeader' // ← new client component

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="font-roboto flex flex-col h-screen">
      {/* Client-side header with auth, dropdown, logout */}
      <ClientHeader />

      <div className="flex flex-1 pt-16 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-gray-50/70">
          <div className="min-h-full p-4 md:p-6 lg:p-8">
            <div className="md:hidden h-4" />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}