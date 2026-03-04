import { Calendar, Clock3, MapPin } from "lucide-react"
import type { Booking } from "../../types/Booking"
import "./ReservationPreviewCard.css"

interface ReservationPreviewCardProps {
  booking: Booking
  statusLabel: string
  pending?: boolean
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" })
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })

const toDate = (value: string): Date => new Date(value)

const getResourceName = (type: Booking["resourceType"]): string => {
  return type === "tennis" ? "Quadra de Tenis" : "Churrasqueira"
}

export default function ReservationPreviewCard({ booking, statusLabel, pending = false }: ReservationPreviewCardProps) {
  const start = toDate(booking.startTime)
  const end = toDate(booking.endTime)
  const isAllDay = start.getHours() === 0 && end.getHours() === 23
  const timeRange = isAllDay ? "Dia inteiro" : `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`

  return (
    <article className="reservation-preview-card">
      <h4>{getResourceName(booking.resourceType)}</h4>
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
      </p>
    </article>
  )
}
