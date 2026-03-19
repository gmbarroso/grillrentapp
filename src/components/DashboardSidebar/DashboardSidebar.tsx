import { Link, useLocation } from "react-router-dom"
import { LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTheme } from "../../context/ThemeContext"
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
  isCollapsed: boolean
  isMobileViewport: boolean
  isMobileOpen: boolean
  onCloseMobile: () => void
  onLogout: () => void
}

export default function DashboardSidebar({
  condominiumName,
  condominiumSubtitle,
  primaryNav,
  adminNav,
  userName,
  userContext,
  isCollapsed,
  isMobileViewport,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}: DashboardSidebarProps) {
  const location = useLocation()
  const { themeMode, setThemeMode } = useTheme()
  const isHiddenOnMobile = isMobileViewport && !isMobileOpen

  const themeOptions = [
    { mode: "light" as const, label: "Tema claro", icon: Sun },
    { mode: "dark" as const, label: "Tema escuro", icon: Moon },
    { mode: "system" as const, label: "Tema automatico", icon: Monitor },
  ]

  return (
    <>
      {isMobileViewport && isMobileOpen && (
        <button
          type="button"
          className="dashboard-sidebar-overlay"
          aria-label="Fechar menu lateral"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`dashboard-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`.trim()}
        aria-hidden={isHiddenOnMobile}
      >
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
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    if (isMobileViewport) onCloseMobile()
                  }}
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

        <div className="dashboard-sidebar-bottom">
          {adminNav.length > 0 && (
            <div className="dashboard-nav-group dashboard-bottom-admin">
              <h3>Administração</h3>
              {adminNav.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <Link
                    key={`admin-${item.to}-${item.label}`}
                    to={item.to}
                    className={`dashboard-nav-item ${isActive ? "active" : ""}`.trim()}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (isMobileViewport) onCloseMobile()
                    }}
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
          )}

          <div className="dashboard-theme-panel">
            <div className="dashboard-theme-options" role="group" aria-label="Selecao de tema">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = themeMode === option.mode
                return (
                  <button
                    key={option.mode}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    className={`dashboard-theme-option ${isActive ? "active" : ""}`.trim()}
                    onClick={() => setThemeMode(option.mode)}
                  >
                    <Icon size={15} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="dashboard-user-box">
            <div className="dashboard-user-identification">
              <span className="dashboard-user-avatar" aria-hidden="true">
                <UserRound size={15} />
              </span>
              <div>
                <strong>{userName}</strong>
                <p>{userContext}</p>
              </div>
            </div>
            <button type="button" onClick={onLogout} aria-label="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
