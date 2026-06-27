'use client'

interface DashboardHeaderProps {
  breadcrumb: string
  userInitials: string
  userName: string
}

export default function DashboardHeader({ breadcrumb, userInitials, userName }: DashboardHeaderProps) {
  return (
    <header className="header">
      <div className="breadcrumb">
        Início / <strong>{breadcrumb}</strong>
      </div>

      <div className="header-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="search" placeholder="Buscar paciente, processo, relatório..." />
      </div>

      <div className="header-actions">
        <button className="notif-btn" aria-label="Notificações">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="badge">3</span>
        </button>

        <div className="header-avatar" title={userName}>
          {userInitials}
        </div>
      </div>
    </header>
  )
}
