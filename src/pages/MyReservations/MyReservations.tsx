"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { BookingSection, Button, DashboardHomeSkeleton, Modal, MyNextBookedDates } from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import { compareBookingStartAsc, isBookingForCurrentUser, isUpcomingBooking } from "../../utils/booking-visibility"
import "./MyReservations.css"

const MyReservations = () => {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const { deleteBooking, isLoading: isDeletingBooking } = useDeleteBooking(token ?? "")
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | null>(null)

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

  const handleDeleteBooking = useCallback((bookingId: string) => {
    setBookingToDeleteId(bookingId)
  }, [])

  const handleConfirmDeleteBooking = useCallback(
    async (bookingId: string) => {
      const result = await deleteBooking(bookingId)
      if (result.success) {
        await refreshBookings()
        showToast("Reserva cancelada com sucesso.", "success")
        setBookingToDeleteId(null)
        return
      }

      showToast("Erro ao cancelar a reserva. Por favor, tente novamente.", "error")
    },
    [deleteBooking, refreshBookings, showToast],
  )

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
        onDeleteBooking={handleDeleteBooking}
        isDeletingBooking={isDeletingBooking}
      />

      <div className="my-reservations-booking">
        <BookingSection token={token ?? ""} onBookingCreated={handleBookingCreated} />
      </div>

      <Modal isOpen={Boolean(bookingToDeleteId)} onClose={() => setBookingToDeleteId(null)}>
        <div className="confirm-booking-modal">
          <h2>Cancelar reserva</h2>
          <p>Deseja realmente cancelar esta reserva?</p>
          <div className="confirm-booking-actions">
            <Button variant="secondary" onClick={() => setBookingToDeleteId(null)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              onClick={() => bookingToDeleteId && handleConfirmDeleteBooking(bookingToDeleteId)}
              disabled={isDeletingBooking}
            >
              Cancelar reserva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MyReservations
