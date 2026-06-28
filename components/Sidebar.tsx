'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'

interface NavSubItem {
  label: string
  href: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  subItems?: NavSubItem[]
}

interface NavGroup {
  section: string
  items: NavItem[]
}

const navItems: NavGroup[] = [
  {
    section: 'Configurações',
    items: [
      {
        label: 'Usuários',
        href: '/dashboard/usuarios',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Faturamento',
    items: [
      {
        label: 'Faturamento',
        href: '/dashboard/faturamento',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        ),
        subItems: [
          { label: 'Smart',               href: '/dashboard/faturamento/smart'           },
          { label: 'AMHP',                href: '/dashboard/faturamento/amhp'            },
          { label: 'Análise Recebimento', href: '/dashboard/faturamento/reconciliacao'   },
          { label: 'Smart fora da AMHP',  href: '/dashboard/faturamento/smart-sem-amhp' },
          { label: 'Sem Faturar Smart',   href: '/dashboard/faturamento/sem-faturar'    },
        ],
      },
    ],
  },
]

interface SidebarProps {
  userName: string
  userRole: string
  userInitials: string
}

export default function Sidebar({ userName, userRole, userInitials }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  /* Expandir automaticamente se algum subitem está ativo */
  const initialOpen = navItems.flatMap(g => g.items)
    .filter(i => i.subItems?.some(s => pathname.startsWith(s.href)))
    .map(i => i.href)
  const [openMenus, setOpenMenus] = useState<string[]>(initialOpen)

  useEffect(() => {
    navItems.flatMap(g => g.items).forEach(item => {
      if (item.subItems?.some(s => pathname.startsWith(s.href))) {
        setOpenMenus(prev => prev.includes(item.href) ? prev : [...prev, item.href])
      }
    })
  }, [pathname])

  function toggleMenu(href: string) {
    setOpenMenus(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    )
  }

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-name-small">Centro Clínico</span>
        <span className="brand-name-big">Diem</span>
      </div>

      <div className="sidebar-user">
        <div className="avatar">{userInitials}</div>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-role">{userRole}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(group => (
          <div key={group.section}>
            <div className="nav-section-title">{group.section}</div>
            {group.items.map(item => {
              const hasChildren = !!(item.subItems && item.subItems.length > 0)
              const isOpen      = openMenus.includes(item.href)
              const isSelfActive = pathname === item.href
              const isChildActive = item.subItems?.some(s => pathname.startsWith(s.href)) ?? false
              const isActive = isSelfActive || isChildActive

              return (
                <div key={item.href}>
                  {hasChildren ? (
                    <button
                      className={`nav-item nav-item-btn${isActive ? ' active' : ''}`}
                      onClick={() => toggleMenu(item.href)}
                    >
                      {item.icon}
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
                      >
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`nav-item${isActive ? ' active' : ''}`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )}

                  {hasChildren && isOpen && (
                    <div className="nav-sub">
                      {item.subItems!.map(sub => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`nav-sub-item${pathname.startsWith(sub.href) ? ' active' : ''}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                          </svg>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-sair" onClick={handleSair}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
