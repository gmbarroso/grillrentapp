import { Link, useLocation } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import BrandMark from "../Brand/BrandMark"
import SidebarUnreadTag from "../SidebarUnreadTag/SidebarUnreadTag"
import "./DashboardSidebar.css"

export interface DashboardSidebarNavItem {
  label: string
  to: string
  icon: LucideIcon
  hasNew?: boolean
  unreadCount?: number
}

interface DashboardSidebarProps {
  condominiumName: string
  condominiumSubtitle: string
  primaryNav: DashboardSidebarNavItem[]
  adminNav: DashboardSidebarNavItem[]
  userName: string
  userContext: string
  onLogout: () => void
}

export default function DashboardSidebar({
  condominiumName,
  condominiumSubtitle,
  primaryNav,
  adminNav,
  userName,
  userContext,
  onLogout,
}: DashboardSidebarProps) {
  const location = useLocation()

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-condominium">
        <BrandMark compact showTagline={false} />
        <div className="dashboard-condominium-text">
          <h2>{condominiumName}</h2>
          <p>{condominiumSubtitle}</p>
        </div>
      </div>

      <div className="dashboard-sidebar-scroll">
        <div className="dashboard-nav-group">
          <h3>Menu Principal</h3>
          {primaryNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={`primary-${item.to}-${item.label}`}
                to={item.to}
                className={`dashboard-nav-item ${isActive ? "active" : ""}`.trim()}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                <SidebarUnreadTag
                  unreadCount={item.unreadCount || 0}
                  showDot={Boolean(item.hasNew)}
                  ariaLabel={`Itens nao lidos em ${item.label}`}
                />
              </Link>
            )
          })}
        </div>

        <div className="dashboard-nav-group">
          <h3>Administração</h3>
          {adminNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={`admin-${item.to}-${item.label}`}
                to={item.to}
                className={`dashboard-nav-item ${isActive ? "active" : ""}`.trim()}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                <SidebarUnreadTag
                  unreadCount={item.unreadCount || 0}
                  showDot={Boolean(item.hasNew)}
                  ariaLabel={`Itens nao lidos em ${item.label}`}
                />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="dashboard-user-box">
        <div>
          <strong>{userName}</strong>
          <p>{userContext}</p>
        </div>
        <button type="button" onClick={onLogout}>
          Sair
        </button>
      </div>
    </aside>
  )
}
