"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CalendarDays, Clock3, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useCreateBooking } from "../../hooks/booking/useCreateBooking"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import { useReservedTimes } from "../../hooks/booking/useReservedTimes"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useToast } from "../../context/ToastContext"
import { useAuth } from "../../context/AuthContext"
import type { Resource } from "../../types/Resource"
import type { Booking, BookingSectionProps } from "../../types/Booking"
import { formatBookingDateKey, formatBookingTimeInterval, BOOKING_DISPLAY_TIMEZONE } from "../../utils/booking-datetime"
import { LoadingSpinner, Modal, Calendar, Tooltip, Button } from "../"
import "./BookingSection.css"

interface PendingBookingData {
  resourceId: string
  startTime: string
  endTime: string
  needTablesAndChairs: boolean
  bookedOnBehalf?: string
}

const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7
  return {
    value: `${hour.toString().padStart(2, "0")}:00`,
    label: `${hour.toString().padStart(2, "0")}:00h - ${(hour + 1).toString().padStart(2, "0")}:00h`,
  }
})

const formatPtDateTitle = (date: Date) => {
  const text = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const sameDateKey = (iso: string, key: string) => formatBookingDateKey(new Date(iso)) === key

const isSameUnit = (booking: Booking, apartment?: string, block?: number) =>
  booking.userApartment === apartment && Number(booking.userBlock) === Number(block)

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BOOKING_DISPLAY_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hour12: false,
  timeZone: BOOKING_DISPLAY_TIMEZONE,
})

const SAO_PAULO_UTC_OFFSET_HOURS = 3

const toSaoPauloUtcInstant = (date: Date, hour: number, minute: number = 0) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour + SAO_PAULO_UTC_OFFSET_HOURS, minute, 0, 0))

const BookingSection: React.FC<BookingSectionProps> = ({ token, onBookingCreated }) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [selectedOption, setSelectedOption] = useState<"daily" | "hourly">("hourly")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [needTablesAndChairs, setNeedTablesAndChairs] = useState(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [bookedOnBehalf, setBookedOnBehalf] = useState("")
  const [isConfirmBookingModalOpen, setIsConfirmBookingModalOpen] = useState(false)
  const [pendingBookingData, setPendingBookingData] = useState<PendingBookingData | null>(null)
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)

  const {
    reservedTimes: unavailableTimes,
    reservedDays,
    isLoading: isLoadingTimes,
    error: timesError,
  } = useReservedTimes(selectedOption, selectedDate)

  const { data: resources, isLoading: isResourcesLoading, error: resourcesError } = useAllResources(token)
  const { createBooking, isLoading: isCreatingBooking } = useCreateBooking(token)
  const { deleteBooking, isLoading: isDeletingBooking } = useDeleteBooking(token)
  const { bookings, refreshBookings } = useAllBookings({ initialLimit: 200 })

  const selectedDateKey = useMemo(() => formatBookingDateKey(selectedDate), [selectedDate])

  const selectedResource = useMemo(() => {
    return resources?.find((resource: Resource) => resource.type === selectedOption) ?? null
  }, [resources, selectedOption])
  const hourlyResource = useMemo(() => resources?.find((resource: Resource) => resource.type === "hourly") ?? null, [resources])
  const dailyResource = useMemo(() => resources?.find((resource: Resource) => resource.type === "daily") ?? null, [resources])

  const resourceBookings = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((booking) => booking.resourceType === selectedOption)
      .filter((booking) => new Date(booking.endTime).getTime() > now.getTime())
  }, [bookings, selectedOption])

  const dayBookings = useMemo(
    () =>
      resourceBookings
        .filter((booking) => sameDateKey(booking.startTime, selectedDateKey))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [resourceBookings, selectedDateKey],
  )

  const hourlyBookingByHour = useMemo(() => {
    const map = new Map<string, Booking>()
    dayBookings.forEach((booking) => {
      const hour = new Date(booking.startTime).getHours().toString().padStart(2, "0")
      map.set(`${hour}:00`, booking)
    })
    return map
  }, [dayBookings])

  const dailyBooking = selectedOption === "daily" ? dayBookings[0] ?? null : null
  const isDailyBookingClosedForSelectedDate = useMemo(() => {
    if (selectedOption !== "daily") return false

    const now = new Date()
    const selectedDayKey = selectedDateKey
    const todayKey = dayFormatter.format(now)
    return selectedDayKey === todayKey
  }, [selectedDateKey, selectedOption])

  const canDeleteBooking = useCallback(
    (booking: Booking) => {
      if (!user) return false
      return booking.userId === user.id || isSameUnit(booking, user.apartment, user.block) || user.role === "admin"
    },
    [user],
  )

  const isPastSlotForSelectedDate = (slot: string) => {
    if (selectedOption !== "hourly") return false

    const now = new Date()
    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: BOOKING_DISPLAY_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const selectedDayKey = dayFormatter.format(selectedDate)
    const todayKey = dayFormatter.format(now)
    if (selectedDayKey !== todayKey) return false

    const [slotHourText] = slot.split(":")
    const slotHour = Number.parseInt(slotHourText, 10)
    const nowHour = Number.parseInt(
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: BOOKING_DISPLAY_TIMEZONE,
      }).format(now),
      10,
    )
    return slotHour <= nowHour
  }

  useEffect(() => {
    if (resourcesError) {
      showToast(t("ErrorLoadingResources"), "error")
    }
  }, [resourcesError, showToast, t])

  useEffect(() => {
    if (timesError && !(selectedOption === "hourly" && !selectedDate)) {
      showToast(t("ErrorFetchingSlots"), "error")
    }
  }, [timesError, selectedDate, selectedOption, showToast, t])

  const buildBookingPayload = (slot?: string | null): PendingBookingData | null => {
    if (!selectedResource) return null

    const now = new Date()
    const todayInSaoPauloKey = dayFormatter.format(now)
    const isSelectedDateTodayInSaoPaulo = selectedDateKey === todayInSaoPauloKey
    let startTime: Date
    let endTime: Date

    if (selectedOption === "hourly") {
      if (!slot) return null
      const [hourText] = slot.split(":")
      const hour = Number.parseInt(hourText, 10)
      startTime = toSaoPauloUtcInstant(selectedDate, hour)
      endTime = toSaoPauloUtcInstant(selectedDate, hour + 1)
    } else {
      startTime = toSaoPauloUtcInstant(selectedDate, 7)
      endTime = toSaoPauloUtcInstant(selectedDate, 22)
    }

    if (selectedOption === "daily" && isSelectedDateTodayInSaoPaulo) {
      showToast(t("ErrorBookingClosedForToday"), "error")
      return null
    }

    return {
      resourceId: selectedResource.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      needTablesAndChairs: selectedOption === "daily" ? needTablesAndChairs : false,
      ...(bookedOnBehalf ? { bookedOnBehalf } : {}),
    }
  }

  const openConfirmBookingModal = (slot?: string | null) => {
    const payload = buildBookingPayload(slot)
    if (!payload) return
    setPendingBookingData(payload)
    setIsConfirmBookingModalOpen(true)
  }

  const handleConfirmBooking = async () => {
    if (!pendingBookingData) return

    try {
      await createBooking(pendingBookingData)
      await refreshBookings()
      await onBookingCreated()
      showToast(t("BookingCreatedSuccess"), "success")
      setSelectedTime(null)
      setNeedTablesAndChairs(false)
      setBookedOnBehalf("")
    } catch (error) {
      console.error("Error creating booking:", error)
      const message = error instanceof Error && error.message ? error.message : t("ErrorCreatingBooking")
      showToast(message, "error")
    } finally {
      setIsConfirmBookingModalOpen(false)
      setPendingBookingData(null)
    }
  }

  const handleDeleteCurrentBooking = async () => {
    if (!bookingToDelete) return
    const result = await deleteBooking(bookingToDelete.id)
    if (result.success) {
      await refreshBookings()
      await onBookingCreated()
      showToast(t("BookingList.DeleteSuccess"), "success")
    } else {
      showToast(t("BookingList.DeleteError"), "error")
    }
    setBookingToDelete(null)
  }

  const rules = useMemo(() => {
    const content = t(`Card.${selectedOption === "hourly" ? "TennisContent" : "GrillContent"}`, {
      returnObjects: true,
    }) as string[]
    return content
  }, [selectedOption, t])

  return (
    <section className="booking-section booking-scheduler">
      <div className="scheduler-tabs">
        <Button
          variant="secondary"
          className={selectedOption === "hourly" ? "selected" : ""}
          onClick={() => setSelectedOption("hourly")}
        >
          {hourlyResource?.name ?? ""}
        </Button>
        <Button
          variant="secondary"
          className={selectedOption === "daily" ? "selected" : ""}
          onClick={() => setSelectedOption("daily")}
        >
          {dailyResource?.name ?? ""}
        </Button>
      </div>

      <div className="scheduler-content">
        <div className="scheduler-main">
          <div className="scheduler-day-title">
            <CalendarDays size={16} />
            <strong>{formatPtDateTitle(selectedDate)}</strong>
          </div>

          {isLoadingTimes ? (
            <div className="scheduler-loading">
              <LoadingSpinner inline />
            </div>
          ) : selectedOption === "hourly" ? (
            <div className="scheduler-slot-list">
              {timeSlots.map((slot) => {
                const booking = hourlyBookingByHour.get(slot.value)
                const isPast = isPastSlotForSelectedDate(slot.value)
                const isBooked = Boolean(booking) || unavailableTimes.includes(slot.value)
                const isBlocked = isPast || isBooked
                const canDelete = booking ? canDeleteBooking(booking) : false

                return (
                  <div key={slot.value} className={`scheduler-slot-row ${isBlocked ? "blocked" : ""}`.trim()}>
                    <div className="scheduler-slot-time">
                      <Clock3 size={15} />
                      <span>{slot.label}</span>
                    </div>

                    {booking ? (
                      <div className="scheduler-slot-actions">
                        <span className="reservation-status confirmed">Confirmado</span>
                        {canDelete ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setBookingToDelete(booking)}
                            className="scheduler-delete-button"
                          >
                            <Trash2 size={13} />
                            Cancelar
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isBlocked}
                        onClick={() => {
                          setSelectedTime(slot.value)
                          openConfirmBookingModal(slot.value)
                        }}
                        className="scheduler-reserve-button"
                      >
                        Reservar
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : dailyBooking ? (
            <div className="scheduler-grill-booking">
              <div className="scheduler-grill-row">
                <div>
                  <strong>Reservado - Dia inteiro</strong>
                  <p>
                    Morador: {dailyBooking.userId === user?.id || isSameUnit(dailyBooking, user?.apartment, user?.block)
                      ? user?.name || "Morador"
                      : `Apt ${dailyBooking.userApartment} Bl. ${dailyBooking.userBlock}`}
                  </p>
                  <p>Apt {dailyBooking.userApartment} Bl. {dailyBooking.userBlock}</p>
                  {dailyBooking.needTablesAndChairs ? <a href="#">Mesas e cadeiras solicitadas</a> : null}
                </div>
                <span className="reservation-status confirmed">Confirmado</span>
              </div>
              <Button variant="secondary" size="sm" disabled={true} className="scheduler-reserve-button">
                Reservado
              </Button>
            </div>
          ) : (
            <div className="scheduler-grill-empty">
              <p className={isDailyBookingClosedForSelectedDate ? "scheduler-grill-warning" : ""}>
                {isDailyBookingClosedForSelectedDate ? "Já não é mais possível reservar para hoje" : "Disponível para reserva"}
              </p>
              <Button variant="primary" disabled={isDailyBookingClosedForSelectedDate} onClick={() => openConfirmBookingModal(null)}>
                Reservar
              </Button>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={needTablesAndChairs}
                  disabled={isDailyBookingClosedForSelectedDate}
                  onChange={() => {
                    if (isDailyBookingClosedForSelectedDate) return
                    setIsAgreementModalOpen(true)
                  }}
                  className="checkbox-input"
                />
                <span className="checkbox-text">{t("NeedTablesAndChairs")}</span>
              </label>
            </div>
          )}

          {user?.role === "admin" ? (
            <div className="admin-booking-field">
              <label htmlFor="bookedOnBehalf" className="admin-booking-label">
                {t("BookOnBehalf")}
                <Tooltip content={t("BookOnBehalfTooltip")} />
              </label>
              <input
                id="bookedOnBehalf"
                type="text"
                value={bookedOnBehalf}
                onChange={(e) => setBookedOnBehalf(e.target.value)}
                maxLength={25}
                className="admin-booking-input"
                placeholder={t("BookOnBehalfPlaceholder")}
              />
            </div>
          ) : null}
        </div>

        <aside className="scheduler-side">
          <div className="scheduler-side-card">
            <Calendar
              reservedDays={selectedOption === "daily" ? reservedDays : []}
              onDateSelect={setSelectedDate}
              resourceType={selectedOption}
              selectedDate={selectedDate}
            />
          </div>
          <div className="scheduler-side-card scheduler-resource-card">
            <h4>{selectedResource?.name ?? ""}</h4>
            <p>{selectedResource?.description ?? ""}</p>
          </div>
        </aside>
      </div>

      <section className="scheduler-rules">
        <h3>Regras de Uso - {selectedResource?.name ?? ""}</h3>
        <ul className="card-content">
          {rules.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <Modal isOpen={isAgreementModalOpen} onClose={() => setIsAgreementModalOpen(false)} wide={true}>
        <div className="agreement-modal">
          <h2 className="agreement-title">{t("TablesAndChairsAgreement.Title")}</h2>
          <p className="agreement-content">
            {t("TablesAndChairsAgreement.Content")
              .replace("[userName]", user?.name || "")
              .replace("[userApartment]", `${user?.apartment || ""} - Bloco ${user?.block || ""}`)}
          </p>

          {(t("TablesAndChairsAgreement.Sections", { returnObjects: true }) as any[]).map((section, index) => (
            <div className="agreement-section" key={index}>
              <div className="agreement-section-title">{section.title}</div>
              <div className="agreement-section-content">{section.content}</div>
            </div>
          ))}

          <div className="agreement-actions">
            <Button
              variant="primary"
              onClick={() => {
                setNeedTablesAndChairs(true)
                setIsAgreementModalOpen(false)
              }}
              className="confirm-button"
            >
              {t("TablesAndChairsAgreement.Confirm")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setNeedTablesAndChairs(false)
                setIsAgreementModalOpen(false)
              }}
              className="cancel-button"
            >
              {t("TablesAndChairsAgreement.Cancel")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmBookingModalOpen} onClose={() => setIsConfirmBookingModalOpen(false)}>
        <div className="confirm-booking-modal">
          <h2>Confirmar reserva</h2>
          <p>
            {selectedOption === "hourly" && selectedTime
              ? `Deseja reservar ${formatBookingTimeInterval(
                  new Date(`${selectedDateKey}T${selectedTime}:00`),
                  new Date(`${selectedDateKey}T${(Number.parseInt(selectedTime, 10) + 1).toString().padStart(2, "0")}:00:00`),
                )}?`
              : "Deseja confirmar esta reserva?"}
          </p>
          <div className="confirm-booking-actions">
            <Button variant="secondary" onClick={() => setIsConfirmBookingModalOpen(false)}>
              Voltar
            </Button>
            <Button variant="primary" onClick={handleConfirmBooking} disabled={isCreatingBooking}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(bookingToDelete)} onClose={() => setBookingToDelete(null)}>
        <div className="confirm-booking-modal">
          <h2>Cancelar reserva</h2>
          <p>Deseja realmente cancelar esta reserva?</p>
          <div className="confirm-booking-actions">
            <Button variant="secondary" onClick={() => setBookingToDelete(null)}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleDeleteCurrentBooking} disabled={isDeletingBooking}>
              Cancelar reserva
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default BookingSection
