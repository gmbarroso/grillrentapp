"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
const CURRENT_FIRST_ACCESS_TOUR_VERSION = 4
const TOUR_CALLOUT_MAX_WIDTH = 340

type TourAnchor = "quick-reserve" | "next-bookings" | "notices" | "sidebar-toggle" | "theme-panel" | null

interface FirstAccessTourStep {
  title: string
  description: string
  anchor: TourAnchor
  previewRoute?: "/mybookeddates" | "/profile" | "/contact"
}

const FIRST_ACCESS_TOUR_STEPS = [
  {
    title: "Bem-vindo ao painel",
    description: "Aqui voce acompanha suas informacoes principais e acessa as acoes rapidas.",
    anchor: null,
  },
  {
    title: "Mostrar e ocultar menu",
    description: "Use este botao para recolher ou expandir a barra lateral e ganhar mais espaco na tela.",
    anchor: "sidebar-toggle",
  },
  {
    title: "Trocar tema",
    description: "No menu lateral, use os botoes de tema para alternar entre claro, escuro ou automatico.",
    anchor: "theme-panel",
  },
  {
    title: "Nova reserva",
    description: "Em Minhas reservas, recursos por hora reservam faixa de horario e recursos dia inteiro reservam o dia completo.",
    anchor: "quick-reserve",
  },
  {
    title: "Minhas proximas reservas",
    description: "Aqui voce ve suas reservas futuras. Na pagina /mybookeddates voce tambem pode cancelar reservas quando necessario.",
    anchor: "next-bookings",
  },
  {
    title: "Avisos e comunicacao",
    description: "Veja avisos recentes no dashboard e acesse Contato para falar com a administracao.",
    anchor: "notices",
  },
  {
    title: "Pagina Minhas reservas",
    description: "Em /mybookeddates voce faz novas reservas e acompanha suas reservas ativas para remover com confirmacao.",
    anchor: null,
    previewRoute: "/mybookeddates",
  },
  {
    title: "Pagina Perfil",
    description: "Em /profile voce atualiza nome e email, altera senha e pode repetir o tour de boas-vindas.",
    anchor: null,
    previewRoute: "/profile",
  },
  {
    title: "Pagina Contato",
    description: "Em /contact voce envia reclamacoes, sugestoes e duvidas para a administracao, identificadas com seu email validado.",
    anchor: null,
    previewRoute: "/contact",
  },
  {
    title: "Tour concluido",
    description: "Pronto. Agora voce conhece o principal do app e pode começar a usar normalmente.",
    anchor: null,
  },
] as const satisfies readonly FirstAccessTourStep[]

const Home = () => {
  const { user, token, onboarding, tour, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const [isPersistingTour, setIsPersistingTour] = useState(false)
  const [tourAnchorRect, setTourAnchorRect] = useState<DOMRect | null>(null)
  const newReservationCardRef = useRef<HTMLDivElement | null>(null)
  const nextBookingsRef = useRef<HTMLDivElement | null>(null)
  const noticesCardRef = useRef<HTMLDivElement | null>(null)

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
    const searchParams = new URLSearchParams(location.search)
    const isOnboardingDone = !onboarding.onboardingRequired
    if (!isOnboardingDone) return

    const hasCompletedTour = (tour.firstAccessTourVersionCompleted ?? 0) >= CURRENT_FIRST_ACCESS_TOUR_VERSION
    const forceStartTour = searchParams.get("startTour") === "1"
    if (!forceStartTour && isTourOpen) return
    if (!forceStartTour && hasCompletedTour) return

    const forcedStep = Number(searchParams.get("tourStep") ?? "0")
    const normalizedStep = Number.isInteger(forcedStep) && forcedStep >= 0 && forcedStep < FIRST_ACCESS_TOUR_STEPS.length
      ? forcedStep
      : 0

    setTourStepIndex(forceStartTour ? normalizedStep : 0)
    setIsTourOpen(true)

    if (forceStartTour) {
      navigate("/", { replace: true })
    }
  }, [isTourOpen, location.search, navigate, onboarding.onboardingRequired, tour.firstAccessTourVersionCompleted])

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

  const isLoadingDashboard = isLoadingBookings || isLoadingNotices
  const isLastTourStep = tourStepIndex === FIRST_ACCESS_TOUR_STEPS.length - 1
  const currentTourStep = FIRST_ACCESS_TOUR_STEPS[tourStepIndex]
  const isTourCalloutStep = isTourOpen && tourStepIndex > 0
  const hasTourAnchor = currentTourStep.anchor !== null
  const hasResolvedTourAnchor = hasTourAnchor && Boolean(tourAnchorRect)

  useEffect(() => {
    if (!isTourOpen) return
    if (!currentTourStep.previewRoute) return
    navigate(`${currentTourStep.previewRoute}?startTour=1&tourStep=${tourStepIndex}`, { replace: true })
  }, [currentTourStep.previewRoute, isTourOpen, navigate, tourStepIndex])

  useEffect(() => {
    if (!isTourCalloutStep) {
      setTourAnchorRect(null)
      return
    }

    const getTarget = (anchor: TourAnchor) => {
      if (anchor === "quick-reserve") return newReservationCardRef.current
      if (anchor === "next-bookings") return nextBookingsRef.current
      if (anchor === "notices") return noticesCardRef.current
      if (anchor === "sidebar-toggle") return document.querySelector<HTMLElement>('[data-tour-target="sidebar-toggle"]')
      if (anchor === "theme-panel") return document.querySelector<HTMLElement>('[data-tour-target="theme-panel"]')
      return null
    }

    const updateAnchor = () => {
      if (currentTourStep.anchor === "theme-panel") {
        const maybeThemePanel = getTarget("theme-panel")
        if (!maybeThemePanel) {
          const sidebarToggle = getTarget("sidebar-toggle")
          sidebarToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        } else {
          maybeThemePanel.scrollIntoView({ block: "center", inline: "nearest" })
        }
      }

      const target = getTarget(currentTourStep.anchor)
      setTourAnchorRect(target ? target.getBoundingClientRect() : null)
    }

    updateAnchor()
    if (currentTourStep.anchor === "theme-panel") {
      window.setTimeout(updateAnchor, 140)
    }
    window.addEventListener("resize", updateAnchor)
    window.addEventListener("scroll", updateAnchor, true)

    return () => {
      window.removeEventListener("resize", updateAnchor)
      window.removeEventListener("scroll", updateAnchor, true)
    }
  }, [currentTourStep.anchor, isTourCalloutStep, tourStepIndex])

  const tourCalloutPosition = useMemo(() => {
    const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight
    const width = Math.min(TOUR_CALLOUT_MAX_WIDTH, viewportWidth - 24)
    const estimatedHeight = 230

    if (!tourAnchorRect) {
      return {
        style: {
          width,
          left: (viewportWidth - width) / 2,
          top: Math.max(16, viewportHeight * 0.25),
        },
        placement: "below" as const,
      }
    }

    const left = Math.min(
      Math.max(12, tourAnchorRect.left + (tourAnchorRect.width - width) / 2),
      viewportWidth - width - 12,
    )
    const shouldPlaceAbove = (viewportHeight - tourAnchorRect.bottom) < (estimatedHeight + 20)
      && tourAnchorRect.top > (estimatedHeight + 28)
    const top = shouldPlaceAbove
      ? Math.max(16, tourAnchorRect.top - estimatedHeight - 12)
      : Math.min(Math.max(16, tourAnchorRect.bottom + 12), viewportHeight - estimatedHeight)

    return {
      style: { width, left, top },
      placement: shouldPlaceAbove ? ("above" as const) : ("below" as const),
    }
  }, [tourAnchorRect])

  const tourHighlightStyle = useMemo(() => {
    if (!tourAnchorRect) return undefined
    return {
      top: tourAnchorRect.top - 6,
      left: tourAnchorRect.left - 6,
      width: tourAnchorRect.width + 12,
      height: tourAnchorRect.height + 12,
    }
  }, [tourAnchorRect])

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
    setTourStepIndex((prev) => {
      const nextIndex = prev + 1
      const nextStep = FIRST_ACCESS_TOUR_STEPS[nextIndex]
      if (nextStep?.previewRoute) {
        navigate(`${nextStep.previewRoute}?startTour=1&tourStep=${nextIndex}`)
        return prev
      }
      return nextIndex
    })
  }

  const handleBackTour = () => {
    setTourStepIndex((prev) => {
      const prevIndex = Math.max(prev - 1, 0)
      const prevStep = FIRST_ACCESS_TOUR_STEPS[prevIndex]
      if (prevStep?.previewRoute) {
        navigate(`${prevStep.previewRoute}?startTour=1&tourStep=${prevIndex}`)
        return prev
      }
      return prevIndex
    })
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
          <div className="dashboard-tour-target" ref={newReservationCardRef}>
            <QuickActionCard title="Nova Reserva" subtitle="Agendar quadra ou churrasqueira" to="/mybookeddates" icon={CalendarDays} />
          </div>
          <div className="dashboard-tour-target" ref={noticesCardRef}>
            <QuickActionCard title="Avisos" subtitle={`${recentNotices.length} avisos recentes`} to="/notices" icon={Bell} tone="yellow" />
          </div>
        </div>

        <div className="dashboard-tour-target" ref={nextBookingsRef}>
          <MyNextBookedDates
            id="reservas"
            bookings={upcomingBookings}
            title="Minhas próximas reservas"
            headingLevel="h3"
            actionLabel="Minhas reservas →"
            onActionClick={() => navigate("/mybookeddates")}
            emptyMessage="Voce nao tem reservas."
          />
        </div>

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

        <Modal isOpen={isTourOpen && tourStepIndex === 0} onClose={() => void persistTourCompletion()}>
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

        {isTourCalloutStep ? (
          <div className="tour-callout-overlay" role="presentation">
            {hasResolvedTourAnchor && tourHighlightStyle ? <div className="tour-highlight" style={tourHighlightStyle} /> : null}
            <div
              className={`tour-callout ${
                hasResolvedTourAnchor ? `tour-callout-arrow-${tourCalloutPosition.placement}` : "tour-callout-no-anchor"
              }`.trim()}
              style={tourCalloutPosition.style}
            >
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
                  disabled={isPersistingTour}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => void persistTourCompletion()}
                  disabled={isPersistingTour}
                >
                  Pular tour
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
          </div>
        ) : null}
      </div>
    )
  )
}

export default Home
