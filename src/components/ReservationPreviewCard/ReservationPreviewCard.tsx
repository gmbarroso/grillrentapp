import { Calendar, Clock3, MapPin, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Booking } from "../../types"
import { formatBookingDate, formatBookingTimeInterval } from "../../utils/booking-datetime"
import Tooltip from "../Tooltip/Tooltip"
import "./ReservationPreviewCard.css"

interface ReservationPreviewCardProps {
  booking: Booking
  statusLabel: string
  pending?: boolean
  onDelete?: (bookingId: string) => void
  isDeleting?: boolean
}

export default function ReservationPreviewCard({
  booking,
  statusLabel,
  pending = false,
  onDelete,
  isDeleting = false,
}: ReservationPreviewCardProps) {
  const { t } = useTranslation()
  const isAllDay = booking.resourceType === "daily"
  const timeRange = isAllDay ? t("BookingList.AllDay") : formatBookingTimeInterval(booking.startTime, booking.endTime)

  return (
    <article className="reservation-preview-card">
      <h4>{booking.resourceName}</h4>
      <span className={`reservation-status ${pending ? "pending" : "confirmed"}`.trim()}>{statusLabel}</span>
      <p>
        <Calendar size={14} />
        {formatBookingDate(booking.startTime, "pt-BR")}
      </p>
      <p>
        <Clock3 size={14} />
        {timeRange}
      </p>
      <p>
        <MapPin size={14} />
        Apto {booking.userApartment} Bl. {booking.userBlock}
        {booking.bookedOnBehalf?.trim() ? (
          <span className="reservation-on-behalf-tooltip">
            <Tooltip content={t("BookingList.BookedOnBehalf", { apartment: booking.bookedOnBehalf })} iconText="!" />
          </span>
        ) : null}
      </p>
      {onDelete ? (
        <button
          type="button"
          className="reservation-delete-button"
          onClick={() => onDelete(booking.id)}
          disabled={isDeleting}
          aria-label="Cancelar reserva"
        >
          <Trash2 size={16} />
        </button>
      ) : null}
    </article>
  )
}
