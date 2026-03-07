import { Link, useLocation } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import BrandMark from "../Brand/BrandMark"
import "./DashboardSidebar.css"

export interface DashboardSidebarNavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
}

interface DashboardSidebarProps {
  condominiumName: string
  condominiumSubtitle: string
  primaryNav: DashboardSidebarNavItem[]
  adminNav: DashboardSidebarNavItem[]
  userName: string
  userContext: string
  collapsed?: boolean
  mobileOpen?: boolean
  onNavigate?: () => void
  onLogout: () => void
}

export default function DashboardSidebar({
  condominiumName,
  condominiumSubtitle,
  primaryNav,
  adminNav,
  userName,
  userContext,
  collapsed = false,
  mobileOpen = false,
  onNavigate,
  onLogout,
}: DashboardSidebarProps) {
  const location = useLocation()

  const handleNavigate = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <aside className={`dashboard-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`.trim()}>
      <div className="dashboard-condominium">
        <BrandMark compact showTagline={false} />
        <div className="dashboard-condominium-text">
          <h2>{condominiumName}</h2>
          <p>{condominiumSubtitle}</p>
        </div>
      </div>

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
              onClick={handleNavigate}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {item.badge ? <small>{item.badge}</small> : null}
            </Link>
          )
        })}
      </div>

      <div className="dashboard-nav-group">
        <h3>Administracao</h3>
        {adminNav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <Link
              key={`admin-${item.to}-${item.label}`}
              to={item.to}
              className={`dashboard-nav-item ${isActive ? "active" : ""}`.trim()}
              onClick={handleNavigate}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {item.badge ? <small>{item.badge}</small> : null}
            </Link>
          )
        })}
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
