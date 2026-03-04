"use client"

import { useEffect, useMemo } from "react"
import { Bell, CalendarDays } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  DashboardHomeSkeleton,
  NoticeCarousel,
  QuickActionCard,
  ReservationPreviewCard,
} from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useAllNotices } from "../../hooks/notice/useAllNotices"
import { useToast } from "../../context/ToastContext"
import "./Home.css"

const Home = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    bookings,
    isLoading: isLoadingBookings,
    isError: bookingsError,
  } = useAllBookings({ initialLimit: 200 })
  const { notices, isLoading: isLoadingNotices, isError: noticesError } = useAllNotices(token || "cookie-session")

  useEffect(() => {
    if (bookingsError) {
      showToast("Erro ao carregar as reservas. Por favor, tente novamente.", "error")
    }
  }, [bookingsError, showToast])

  useEffect(() => {
    if (noticesError) {
      showToast("Erro ao carregar os avisos. Por favor, tente novamente.", "error")
    }
  }, [noticesError, showToast])

  const upcomingBookings = useMemo(
    () => {
      if (!user?.id) return []

      const now = new Date()
      return [...bookings]
        .filter((booking) => {
          const sameUserId = booking.userId === user.id
          const sameUnit = booking.userApartment === user.apartment && Number(booking.userBlock) === Number(user.block)
          return sameUserId || sameUnit
        })
        .filter((booking) => new Date(booking.endTime).getTime() > now.getTime())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 4)
    },
    [bookings, user?.id, user?.apartment, user?.block],
  )

  const recentNotices = useMemo(
    () =>
      [...notices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [notices],
  )

  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date())

  const isLoadingDashboard = isLoadingBookings || isLoadingNotices

  return (
    isLoadingDashboard ? (
      <DashboardHomeSkeleton />
    ) : (
      <div className="dashboard-home">
        <header className="dashboard-home-hero">
          <div>
            <h2>Bem-vindo, {user?.name}</h2>
            <p>
              Apt {user?.apartment} - Bloco {user?.block}
            </p>
          </div>
          <div className="dashboard-home-meta">
            <span>{dateLabel}</span>
            <b>{user?.role === "admin" ? "Admin" : "Residente"}</b>
          </div>
        </header>

        <div className="dashboard-home-actions">
          <QuickActionCard title="Nova Reserva" subtitle="Agendar quadra ou churrasqueira" to="/minhas-reservas" icon={CalendarDays} />
          <QuickActionCard title="Avisos" subtitle={`${recentNotices.length} avisos recentes`} to="/notices" icon={Bell} tone="yellow" />
        </div>

        <section className="dashboard-section" id="reservas">
          <header>
            <h3>Minhas proximas reservas</h3>
            <button type="button" onClick={() => navigate("/minhas-reservas")}>
              Minhas reservas →
            </button>
          </header>

          <div className={`dashboard-reservation-grid count-${upcomingBookings.length}`.trim()}>
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => {
                const pending = booking.bookedOnBehalf?.trim()
                return (
                  <ReservationPreviewCard
                    key={booking.id}
                    booking={booking}
                    statusLabel={pending ? "Pag. Pendente" : "Confirmado"}
                    pending={Boolean(pending)}
                  />
                )
                })
              ) : (
                <p className="dashboard-empty-message">Voce nao tem reservas.</p>
              )}
          </div>
        </section>

        <section className="dashboard-section">
          <header>
            <h3>Avisos Recentes</h3>
            <button type="button" onClick={() => navigate("/notices")}>
              Ver todos →
            </button>
          </header>

          <div className="dashboard-notice-list">
            {recentNotices.length > 0 ? <NoticeCarousel notices={recentNotices} /> : <p className="dashboard-empty-message">Nao ha avisos recentes.</p>}
          </div>
        </section>
      </div>
    )
  )
}

export default Home
