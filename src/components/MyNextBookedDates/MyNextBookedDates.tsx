import ReservationPreviewCard from "../ReservationPreviewCard/ReservationPreviewCard"
import type { Booking } from "../../types/Booking"
import "./MyNextBookedDates.css"

interface MyNextBookedDatesProps {
  bookings: Booking[]
  title?: string
  headingLevel?: "h2" | "h3"
  actionLabel?: string
  onActionClick?: () => void
  emptyMessage?: string
  id?: string
}

export default function MyNextBookedDates({
  bookings,
  title = "Minhas proximas reservas",
  headingLevel = "h3",
  actionLabel,
  onActionClick,
  emptyMessage = "Voce nao tem reservas.",
  id,
}: MyNextBookedDatesProps) {
  const HeadingTag = headingLevel
  const showAction = Boolean(actionLabel && onActionClick)

  return (
    <section className="next-booked-dates" id={id}>
      <header className="next-booked-dates-header">
        <HeadingTag className="next-booked-dates-title">{title}</HeadingTag>
        {showAction ? (
          <button type="button" className="next-booked-dates-action" onClick={onActionClick}>
            {actionLabel}
          </button>
        ) : null}
      </header>

      <div className={`next-booked-dates-grid count-${bookings.length}`.trim()}>
        {bookings.length > 0 ? (
          bookings.map((booking) => {
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
          <p className="next-booked-dates-empty">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}
