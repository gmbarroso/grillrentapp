"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { BookingSection, DashboardHomeSkeleton, MyNextBookedDates } from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { compareBookingStartAsc, isBookingForCurrentUser, isUpcomingBooking } from "../../utils/booking-visibility"
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
    const now = new Date()

    return [...bookings]
      .filter((booking) => isBookingForCurrentUser(booking, user))
      .filter((booking) => isUpcomingBooking(booking, now))
      .sort(compareBookingStartAsc)
  }, [bookings, user])

  const upcomingPreview = useMemo(() => myBookings.slice(0, 4), [myBookings])

  const handleBookingCreated = useCallback(async () => {
    await refreshBookings()
  }, [refreshBookings])

  if (isLoading) {
    return <DashboardHomeSkeleton />
  }

  return (
    <div className="my-reservations-page">
      <MyNextBookedDates
        bookings={upcomingPreview}
        title="Minhas próximas reservas"
        headingLevel="h2"
        emptyMessage="Voce nao tem reservas."
      />

      <div className="my-reservations-booking">
        <BookingSection token={token ?? ""} onBookingCreated={handleBookingCreated} />
      </div>
    </div>
  )
}

export default MyReservations
