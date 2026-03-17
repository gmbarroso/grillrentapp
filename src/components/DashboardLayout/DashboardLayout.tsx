import { useCallback, useMemo, type ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"
import {
  Boxes,
  Bell,
  CalendarDays,
  CircleUserRound,
  Cog,
  House,
  Inbox,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useNoticeUnreadState } from "../../hooks/notice/useNoticeReadTracking"
import { useMessageUnreadState } from "../../hooks/message/useMessageUnreadState"
import DashboardSidebar, { type DashboardSidebarNavItem } from "../DashboardSidebar/DashboardSidebar"
import "./DashboardLayout.css"

interface DashboardLayoutProps {
  children?: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { hasUnread } = useNoticeUnreadState()
  const isAdmin = user?.role === "admin"
  const { hasUnread: hasUnreadMessages } = useMessageUnreadState(isAdmin)

  const onLogout = useCallback(async () => {
    await logout()
  }, [logout])

  const pageTitle = useMemo(() => {
    const labels: Record<string, string> = {
      "/": "Inicio",
      "/mybookeddates": "Minhas reservas",
      "/notices": "Avisos",
      "/profile": "Perfil",
      "/change-password": "Change Password",
      "/contact": "Contato",
      "/admin/reservas": "Gerenciar Reservas",
      "/admin/residents": "Manage Residents",
      "/admin/resources": "Recursos",
      "/admin/notices": "Gerenciar Avisos",
      "/admin/messages": "Mensagens",
      "/admin/settings": "Settings",
      "/admin/settings/identity": "Condominium Identity",
      "/admin/settings/whatsapp": "WhatsApp Integration",
      "/admin/settings/contact-email": "Contact Email Delivery",
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
    { label: "Inicio", to: "/", icon: House },
    { label: "Minhas reservas", to: "/mybookeddates", icon: CalendarDays },
    { label: "Avisos", to: "/notices", icon: Bell, hasNew: hasUnread },
    { label: "Perfil", to: "/profile", icon: CircleUserRound },
    { label: "Contato", to: "/contact", icon: Phone },
  ]

  const adminNav: DashboardSidebarNavItem[] = [
    { label: "Reservas", to: "/admin/reservas", icon: CalendarDays },
    { label: "Residents", to: "/admin/residents", icon: Users },
    { label: "Recursos", to: "/admin/resources", icon: Boxes },
    { label: "Avisos", to: "/admin/notices", icon: MessageSquare },
    { label: "Mensagens", to: "/admin/messages", icon: Inbox, hasNew: hasUnreadMessages },
    { label: "Settings", to: "/admin/settings", icon: Cog },
  ]

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        condominiumName="Chacara Sacopa"
        condominiumSubtitle="Gestao do Condominio"
        primaryNav={primaryNav}
        adminNav={isAdmin ? adminNav : []}
        userName={user?.name || "Morador"}
        userContext={`Apt ${user?.apartment || "--"} Bl. ${user?.block || "--"}`}
        onLogout={onLogout}
      />

      <div className="dashboard-main">
        <header className="dashboard-shell-topbar">
          <div className="dashboard-shell-topbar-left">
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
