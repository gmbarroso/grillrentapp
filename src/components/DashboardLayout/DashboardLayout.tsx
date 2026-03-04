import { useCallback, type ReactNode } from "react"
import { Outlet } from "react-router-dom"
import {
  Bell,
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  Cog,
  Handshake,
  KeyRound,
  LayoutGrid,
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

  const onLogout = useCallback(async () => {
    await logout()
  }, [logout])

  const primaryNav: DashboardSidebarNavItem[] = [
    { label: "Inicio", to: "/", icon: LayoutGrid },
    { label: "Minhas reservas", to: "/minhas-reservas", icon: CalendarDays },
    { label: "Avisos", to: "/notices", icon: Bell },
    { label: "Perfil", to: "/profile", icon: CircleUserRound },
    { label: "Contato", to: "/contact", icon: Handshake },
  ]

  const adminNav: DashboardSidebarNavItem[] = [
    { label: "Painel Admin", to: "/profile", icon: ClipboardList },
    { label: "Minhas reservas", to: "/minhas-reservas", icon: CalendarDays },
    { label: "Pagamentos", to: "/contact", icon: MessageSquare, badge: 4 },
    { label: "Moradores", to: "/profile", icon: Users },
    { label: "Funcionarios", to: "/contact", icon: Users },
    { label: "Usuarios", to: "/profile", icon: KeyRound },
    { label: "Recursos", to: "/contact", icon: Package },
    { label: "Estoque", to: "/contact", icon: Package, badge: 6 },
    { label: "Avisos", to: "/notices", icon: Bell, badge: 2 },
    { label: "Configuracoes", to: "/profile", icon: Cog },
  ]

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        condominiumName="Chacara Sacopa"
        condominiumSubtitle="Gestao do Condominio"
        primaryNav={primaryNav}
        adminNav={adminNav}
        userName={user?.name || "Morador"}
        userContext={`Apt ${user?.apartment || "--"} Bl. ${user?.block || "--"}`}
        onLogout={onLogout}
      />

      <div className="dashboard-main">
        <main className="dashboard-main-content">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
