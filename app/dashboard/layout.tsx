import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import DashboardHeader from '@/components/DashboardHeader'

function getInitials(email: string, name?: string): string {
  if (name) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userName = user.user_metadata?.full_name ?? user.email ?? 'Usuário'
  const userRole = user.user_metadata?.role ?? 'Colaborador'
  const userInitials = getInitials(user.email ?? '', user.user_metadata?.full_name)

  return (
    <div className="dashboard-screen">
      <Sidebar
        userName={userName}
        userRole={userRole}
        userInitials={userInitials}
      />
      <div className="main-layout">
        <DashboardHeader
          breadcrumb="Dashboard"
          userInitials={userInitials}
          userName={userName}
        />
        {children}
      </div>
    </div>
  )
}
