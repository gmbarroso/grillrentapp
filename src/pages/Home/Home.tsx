"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CalendarDays } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  Button,
  DashboardHomeSkeleton,
  Modal,
  MyNextBookedDates,
  NoticeCarousel,
  QuickActionCard,
} from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useAllNotices } from "../../hooks/notice/useAllNotices"
import { isNoticeUnread, useNoticeUnreadState } from "../../hooks/notice/useNoticeReadTracking"
import { useToast } from "../../context/ToastContext"
import { extractApiErrorMessage, fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import { compareBookingStartAsc, isBookingForCurrentUser, isUpcomingBooking } from "../../utils/booking-visibility"
import "./Home.css"

const API_BASE_URL = getApiBaseUrl()
const CURRENT_FIRST_ACCESS_TOUR_VERSION = 1
const FIRST_ACCESS_TOUR_STEPS = [
  {
    title: "Bem-vindo ao painel",
    description: "Aqui voce acompanha suas informacoes principais e acessa as acoes rapidas.",
  },
  {
    title: "Nova reserva",
    description: "Use Minhas reservas para escolher recurso, data e horario disponiveis.",
  },
  {
    title: "Avisos e comunicacao",
    description: "Veja avisos recentes no dashboard e acesse Contato para falar com a administracao.",
  },
]

const Home = () => {
  const { user, token, onboarding, tour, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const [isPersistingTour, setIsPersistingTour] = useState(false)

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

  useEffect(() => {
    const isOnboardingDone = !onboarding.onboardingRequired
    if (!isOnboardingDone) return

    const hasCompletedTour = (tour.firstAccessTourVersionCompleted ?? 0) >= CURRENT_FIRST_ACCESS_TOUR_VERSION
    const forceStartTour = new URLSearchParams(location.search).get("startTour") === "1"
    if (!forceStartTour && hasCompletedTour) return

    setTourStepIndex(0)
    setIsTourOpen(true)

    if (forceStartTour) {
      navigate("/", { replace: true })
    }
  }, [location.search, navigate, onboarding.onboardingRequired, tour.firstAccessTourVersionCompleted])

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
  const isLastTourStep = tourStepIndex === FIRST_ACCESS_TOUR_STEPS.length - 1
  const currentTourStep = FIRST_ACCESS_TOUR_STEPS[tourStepIndex]

  const persistTourCompletion = async () => {
    if (isPersistingTour) return
    try {
      setIsPersistingTour(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/users/tour/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CURRENT_FIRST_ACCESS_TOUR_VERSION }),
      })
      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao concluir tour (${response.status})`)
        throw new Error(message)
      }
      await refreshProfile()
    } catch (error) {
      console.error(handleApiError(error, "/users/tour/complete"))
      showToast(error instanceof Error ? error.message : "Nao foi possivel concluir o tour agora.", "error")
    } finally {
      setIsPersistingTour(false)
      setIsTourOpen(false)
    }
  }

  const handleAdvanceTour = () => {
    if (isLastTourStep) {
      void persistTourCompletion()
      return
    }
    setTourStepIndex((prev) => prev + 1)
  }

  const handleBackTour = () => {
    setTourStepIndex((prev) => Math.max(prev - 1, 0))
  }

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

        <Modal isOpen={isTourOpen} onClose={() => void persistTourCompletion()}>
          <div className="first-access-tour">
            <span className="first-access-tour-chip">
              Tour {tourStepIndex + 1}/{FIRST_ACCESS_TOUR_STEPS.length}
            </span>
            <h2>{currentTourStep.title}</h2>
            <p>{currentTourStep.description}</p>
            <div className="first-access-tour-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBackTour}
                disabled={tourStepIndex === 0 || isPersistingTour}
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleAdvanceTour}
                isLoading={isPersistingTour}
                loadingText="Salvando..."
              >
                {isLastTourStep ? "Concluir tour" : "Proximo"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  )
}

export default Home
