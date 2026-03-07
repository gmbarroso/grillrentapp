import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  CircleUserRound,
  Cog,
  Handshake,
  LayoutGrid,
  PanelLeft,
  PanelLeftClose,
  MessageSquare,
  Package,
  Users,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import DashboardSidebar, { type DashboardSidebarNavItem } from "../DashboardSidebar/DashboardSidebar"
import "./DashboardLayout.css"

interface DashboardLayoutProps {
  children?: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const onLogout = useCallback(async () => {
    await logout()
  }, [logout])

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(max-width: 1080px)")
    const syncViewport = (matches: boolean) => {
      setIsMobileViewport(matches)
      setIsMobileSidebarOpen(false)
      if (matches) {
        setIsSidebarCollapsed(false)
      }
    }

    syncViewport(mediaQuery.matches)

    const listener = (event: MediaQueryListEvent) => {
      syncViewport(event.matches)
    }

    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  const toggleSidebar = useCallback(() => {
    if (isMobileViewport) {
      setIsMobileSidebarOpen((prev) => !prev)
      return
    }

    setIsSidebarCollapsed((prev) => !prev)
  }, [isMobileViewport])

  const closeSidebarOnNavigate = useCallback(() => {
    if (isMobileViewport) {
      setIsMobileSidebarOpen(false)
    }
  }, [isMobileViewport])

  const pageTitle = useMemo(() => {
    const labels: Record<string, string> = {
      "/": "Inicio",
      "/minhas-reservas": "Minhas reservas",
      "/notices": "Avisos",
      "/profile": "Perfil",
      "/contact": "Contato",
    }

    return labels[location.pathname] ?? "Dashboard"
  }, [location.pathname])

  const topbarDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  )

  const primaryNav: DashboardSidebarNavItem[] = [
    { label: "Inicio", to: "/", icon: LayoutGrid },
    { label: "Minhas reservas", to: "/minhas-reservas", icon: CalendarDays },
    { label: "Avisos", to: "/notices", icon: Bell },
    { label: "Perfil", to: "/profile", icon: CircleUserRound },
    { label: "Contato", to: "/contact", icon: Handshake },
  ]

  const adminNav: DashboardSidebarNavItem[] = [
    { label: "Minhas reservas", to: "/minhas-reservas", icon: CalendarDays },
    { label: "Moradores", to: "/profile", icon: Users },
    { label: "Recursos", to: "/contact", icon: Package },
    { label: "Avisos", to: "/notices", icon: Bell, badge: 2 },
    { label: "Configuracoes", to: "/profile", icon: Cog },
  ]

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`.trim()}>
      {isMobileViewport && isMobileSidebarOpen ? <button type="button" className="dashboard-overlay" onClick={toggleSidebar} aria-label="Fechar menu lateral" /> : null}

      <DashboardSidebar
        condominiumName="Chacara Sacopa"
        condominiumSubtitle="Gestao do Condominio"
        primaryNav={primaryNav}
        adminNav={adminNav}
        userName={user?.name || "Morador"}
        userContext={`Apt ${user?.apartment || "--"} Bl. ${user?.block || "--"}`}
        collapsed={!isMobileViewport && isSidebarCollapsed}
        mobileOpen={isMobileViewport ? isMobileSidebarOpen : true}
        onNavigate={closeSidebarOnNavigate}
        onLogout={onLogout}
      />

      <div className="dashboard-main">
        <header className="dashboard-shell-topbar">
          <div className="dashboard-shell-topbar-left">
            <button type="button" className="sidebar-toggle-button" onClick={toggleSidebar} aria-label="Mostrar ou esconder menu lateral">
              {isMobileViewport || !isSidebarCollapsed ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
            <h1>{pageTitle}</h1>
          </div>

          <div className="dashboard-shell-topbar-meta">
            <span>{topbarDateLabel}</span>
            <b>{user?.role === "admin" ? "Admin" : "Residente"}</b>
          </div>
        </header>

        <main className="dashboard-main-content">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
