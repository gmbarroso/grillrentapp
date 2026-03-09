"use client"

import { useEffect, useMemo } from "react"
import { Bell, CalendarDays } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  DashboardHomeSkeleton,
  MyNextBookedDates,
  NoticeCarousel,
  QuickActionCard,
} from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useAllNotices } from "../../hooks/notice/useAllNotices"
import { isNoticeUnread, useNoticeUnreadState } from "../../hooks/notice/useNoticeReadTracking"
import { useToast } from "../../context/ToastContext"
import { compareBookingStartAsc, isBookingForCurrentUser, isUpcomingBooking } from "../../utils/booking-visibility"
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
  const { lastSeenNoticesAt } = useNoticeUnreadState()

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

  const upcomingBookings = useMemo(() => {
    const now = new Date()

    return [...bookings]
      .filter((booking) => isBookingForCurrentUser(booking, user))
      .filter((booking) => isUpcomingBooking(booking, now))
      .sort(compareBookingStartAsc)
      .slice(0, 4)
  }, [bookings, user])

  const recentNotices = useMemo(
    () =>
      [...notices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [notices],
  )
  const unreadRecentNoticeIds = useMemo(
    () =>
      new Set(
        recentNotices
          .filter((notice) => isNoticeUnread(notice.createdAt, lastSeenNoticesAt))
          .map((notice) => notice.id),
      ),
    [lastSeenNoticesAt, recentNotices],
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
        </header>

        <div className="dashboard-home-actions">
          <QuickActionCard title="Nova Reserva" subtitle="Agendar quadra ou churrasqueira" to="/mybookeddates" icon={CalendarDays} />
          <QuickActionCard title="Avisos" subtitle={`${recentNotices.length} avisos recentes`} to="/notices" icon={Bell} tone="yellow" />
        </div>

        <MyNextBookedDates
          id="reservas"
          bookings={upcomingBookings}
          title="Minhas próximas reservas"
          headingLevel="h3"
          actionLabel="Minhas reservas →"
          onActionClick={() => navigate("/mybookeddates")}
          emptyMessage="Voce nao tem reservas."
        />

        <section className="dashboard-section">
          <header>
            <h3>Avisos Recentes</h3>
            <button type="button" onClick={() => navigate("/notices")}>
              Ver todos →
            </button>
          </header>

          <div className="dashboard-notice-list">
            {recentNotices.length > 0 ? (
              <NoticeCarousel notices={recentNotices} unreadNoticeIds={unreadRecentNoticeIds} />
            ) : (
              <p className="dashboard-empty-message">Nao ha avisos recentes.</p>
            )}
          </div>
        </section>
      </div>
    )
  )
}

export default Home
