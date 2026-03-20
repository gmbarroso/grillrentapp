import { Calendar, Clock3, MapPin, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Booking } from "../../types"
import Tooltip from "../Tooltip/Tooltip"
import "./ReservationPreviewCard.css"

interface ReservationPreviewCardProps {
  booking: Booking
  statusLabel: string
  pending?: boolean
  onDelete?: (bookingId: string) => void
  isDeleting?: boolean
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" })
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })

const toDate = (value: string): Date => new Date(value)

export default function ReservationPreviewCard({
  booking,
  statusLabel,
  pending = false,
  onDelete,
  isDeleting = false,
}: ReservationPreviewCardProps) {
  const { t } = useTranslation()
  const start = toDate(booking.startTime)
  const end = toDate(booking.endTime)
  const isAllDay = start.getHours() === 0 && end.getHours() === 23
  const timeRange = isAllDay ? "Dia inteiro" : `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`

  return (
    <article className="reservation-preview-card">
      <h4>{booking.resourceName}</h4>
      <span className={`reservation-status ${pending ? "pending" : "confirmed"}`.trim()}>{statusLabel}</span>
      <p>
        <Calendar size={14} />
        {dateFormatter.format(start)}
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
