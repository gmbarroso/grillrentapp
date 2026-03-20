import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"
import {
  Boxes,
  Bell,
  CalendarDays,
  CircleUserRound,
  Cog,
  House,
  Inbox,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useNoticeUnreadState } from "../../hooks/notice/useNoticeReadTracking"
import { useMessageUnreadState } from "../../hooks/message/useMessageUnreadState"
import DashboardSidebar, { type DashboardSidebarNavItem } from "../DashboardSidebar/DashboardSidebar"
import "./DashboardLayout.css"

interface DashboardLayoutProps {
  children?: ReactNode
}

const SIDEBAR_COLLAPSED_KEY = "dashboard-sidebar-collapsed"
const MOBILE_BREAKPOINT = 760

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { hasUnread } = useNoticeUnreadState()
  const isAdmin = user?.role === "admin"
  const { hasUnread: hasUnreadMessages } = useMessageUnreadState(isAdmin)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
  })
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth <= MOBILE_BREAKPOINT
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const onLogout = useCallback(async () => {
    await logout()
  }, [logout])

  const pageTitle = useMemo(() => {
    const labels: Record<string, string> = {
      "/": "Inicio",
      "/mybookeddates": "Minhas reservas",
      "/notices": "Avisos",
      "/profile": "Perfil",
      "/change-password": "Alterar senha",
      "/contact": "Contato",
      "/admin/bookeddates": "Gerenciar Reservas",
      "/admin/residents": "Gerenciar Moradores",
      "/admin/resources": "Recursos",
      "/admin/notices": "Gerenciar Avisos",
      // "/admin/messages": "Mensagens",
      "/admin/settings": "Configurações",
      "/admin/settings/identity": "Identidade do Condomínio",
      "/admin/settings/whatsapp": "Integração WhatsApp",
      "/admin/settings/contact-email": "Entrega de E-mail de Contato",
    }

    return labels[location.pathname] ?? "Painel"
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

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = () => {
      setIsMobileViewport(media.matches)
      if (!media.matches) {
        setIsMobileSidebarOpen(false)
      }
    }

    onChange()
    media.addEventListener("change", onChange)
    return () => {
      media.removeEventListener("change", onChange)
    }
  }, [])

  useEffect(() => {
    if (!isMobileViewport) return
    setIsMobileSidebarOpen(false)
  }, [location.pathname, isMobileViewport])

  useEffect(() => {
    if (!isMobileViewport) return
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileSidebarOpen, isMobileViewport])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const toggleSidebar = useCallback(() => {
    if (isMobileViewport) {
      setIsMobileSidebarOpen((prev) => !prev)
      return
    }
    setIsSidebarCollapsed((prev) => !prev)
  }, [isMobileViewport])

  const primaryNav: DashboardSidebarNavItem[] = [
    { label: "Inicio", to: "/", icon: House },
    { label: "Minhas reservas", to: "/mybookeddates", icon: CalendarDays },
    { label: "Avisos", to: "/notices", icon: Bell, hasNew: hasUnread },
    { label: "Perfil", to: "/profile", icon: CircleUserRound },
    { label: "Contato", to: "/contact", icon: Phone },
  ]

  const adminNav: DashboardSidebarNavItem[] = [
    { label: "Reservas", to: "/admin/bookeddates", icon: CalendarDays },
    { label: "Moradores", to: "/admin/residents", icon: Users },
    { label: "Recursos", to: "/admin/resources", icon: Boxes },
    { label: "Avisos", to: "/admin/notices", icon: MessageSquare },
    // { label: "Mensagens", to: "/admin/messages", icon: Inbox, hasNew: hasUnreadMessages },
    { label: "Configurações", to: "/admin/settings", icon: Cog },
  ]

  return (
    <div
      className={`dashboard-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isMobileSidebarOpen ? "sidebar-mobile-open" : ""}`.trim()}
    >
      <DashboardSidebar
        condominiumName="Chacara Sacopa"
        condominiumSubtitle="Gestão do Condomínio"
        primaryNav={primaryNav}
        adminNav={isAdmin ? adminNav : []}
        userName={user?.name || "Morador"}
        userContext={`Apt ${user?.apartment || "--"} Bl. ${user?.block || "--"}`}
        isCollapsed={isSidebarCollapsed}
        isMobileViewport={isMobileViewport}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={onLogout}
      />

      <div className="dashboard-main">
        <header className="dashboard-shell-topbar">
          <div className="dashboard-shell-topbar-left">
            <button
              type="button"
              className="dashboard-shell-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={
                isMobileViewport
                  ? isMobileSidebarOpen
                    ? "Fechar menu"
                    : "Abrir menu"
                  : isSidebarCollapsed
                    ? "Expandir barra lateral"
                    : "Recolher barra lateral"
              }
            >
              {isMobileViewport ? (
                isMobileSidebarOpen ? <X size={17} /> : <Menu size={17} />
              ) : isSidebarCollapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
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
