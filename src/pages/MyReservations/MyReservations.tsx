"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { BookingSection, DashboardHomeSkeleton, ReservationPreviewCard } from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import "./MyReservations.css"

const MyReservations = () => {
  const { user, token } = useAuth()
  const { showToast } = useToast()

  const {
    bookings,
    isLoading,
    isError,
    refreshBookings,
  } = useAllBookings({ initialLimit: 200 })

  useEffect(() => {
    if (isError) {
      showToast("Erro ao carregar as reservas. Por favor, tente novamente.", "error")
    }
  }, [isError, showToast])

  const myBookings = useMemo(() => {
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
  }, [bookings, user?.id, user?.apartment, user?.block])

  const upcomingPreview = useMemo(() => myBookings.slice(0, 4), [myBookings])

  const handleBookingCreated = useCallback(async () => {
    await refreshBookings()
  }, [refreshBookings])

  if (isLoading) {
    return <DashboardHomeSkeleton />
  }

  return (
    <div className="my-reservations-page">
      <section className="my-reservations-preview">
        <header>
          <h2>Minhas proximas reservas</h2>
        </header>

        <div className={`my-reservations-grid count-${upcomingPreview.length}`.trim()}>
          {upcomingPreview.length > 0 ? (
            upcomingPreview.map((booking) => {
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
            <p className="my-reservations-empty">Voce nao tem reservas.</p>
          )}
        </div>
      </section>

      <section className="my-reservations-booking">
        <BookingSection token={token ?? ""} onBookingCreated={handleBookingCreated} />
      </section>
    </div>
  )
}

export default MyReservations
