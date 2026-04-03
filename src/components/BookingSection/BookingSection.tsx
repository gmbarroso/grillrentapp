"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CalendarDays, Clock3, RefreshCw, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useCreateBooking } from "../../hooks/booking/useCreateBooking"
import { useCreateBatchBooking } from "../../hooks/booking/useCreateBatchBooking"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import { useReservedTimes } from "../../hooks/booking/useReservedTimes"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useToast } from "../../context/ToastContext"
import { useAuth } from "../../context/AuthContext"
import type { Resource } from "../../types"
import type { BatchBookingResponse, Booking, BookingSectionProps } from "../../types"
import { formatBookingDateKey, formatBookingHourSlot, BOOKING_DISPLAY_TIMEZONE } from "../../utils/booking-datetime"
import { Modal, Drawer, Calendar, Tooltip, Button, SchedulerSlotsSkeleton } from "../"
import "./BookingSection.css"

interface PendingBookingData {
  resourceId: string
  startTime: string
  endTime: string
  needTablesAndChairs: boolean
  bookedOnBehalf?: string
}

interface PendingHourlyBookingSelection {
  slot: string
  startHour: number
  endHour: number
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

const SAO_PAULO_UTC_OFFSET_HOURS = 3

const toSaoPauloUtcInstant = (date: Date, hour: number, minute: number = 0) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour + SAO_PAULO_UTC_OFFSET_HOURS, minute, 0, 0))

const bookingOwnerLabel = (booking: Booking) => `apt. ${booking.userApartment} bl. ${booking.userBlock}`

const bookingDetailsTooltip = (booking: Booking) => {
  const lines = [`Reservado pelo ${bookingOwnerLabel(booking)}`]
  if (booking.bookedOnBehalf?.trim()) {
    lines.push(`Reserva em nome de ${booking.bookedOnBehalf}`)
  }
  return lines.join(" • ")
}

const formatPanelDateLabel = (date: Date) => {
  const text = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const formatPanelResultDate = (dateIso: string) => {
  const date = new Date(dateIso)
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(date)
}

const formatPanelTimeRange = (startIso: string, endIso: string) => {
  const format = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: BOOKING_DISPLAY_TIMEZONE,
    }).format(new Date(value))
  return `${format(startIso)} — ${format(endIso)}h`
}

const BookingSection: React.FC<BookingSectionProps> = ({ token, onBookingCreated }) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [selectedOption, setSelectedOption] = useState<"daily" | "hourly">("hourly")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [needTablesAndChairs, setNeedTablesAndChairs] = useState(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [bookedOnBehalf, setBookedOnBehalf] = useState("")
  const [pendingBookingData, setPendingBookingData] = useState<PendingBookingData | null>(null)
  const [isConfirmBookingPanelOpen, setIsConfirmBookingPanelOpen] = useState(false)
  const [isRecurringEnabled, setIsRecurringEnabled] = useState(false)
  const [pendingHourlySelection, setPendingHourlySelection] = useState<PendingHourlyBookingSelection | null>(null)
  const [recurringSelectedDates, setRecurringSelectedDates] = useState<Date[]>([])
  const [batchBookingResult, setBatchBookingResult] = useState<BatchBookingResponse | null>(null)
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)

  const {
    reservedTimes: unavailableTimes,
    reservedTimeDetails,
    reservedDays,
    reservedDayDetails,
    isLoading: isLoadingTimes,
    error: timesError,
  } = useReservedTimes(selectedOption, selectedDate)

  const { data: resources, isLoading: isResourcesLoading, error: resourcesError } = useAllResources(token)
  const { createBooking, isLoading: isCreatingBooking } = useCreateBooking(token)
  const { createBatchBooking, isLoading: isCreatingBatchBooking } = useCreateBatchBooking(token)
  const { deleteBooking, isLoading: isDeletingBooking } = useDeleteBooking(token)
  const { bookings, refreshBookings } = useAllBookings({ initialLimit: 1000 })

  const selectedDateKey = useMemo(() => formatBookingDateKey(selectedDate), [selectedDate])

  const selectedResource = useMemo(() => {
    return resources?.find((resource: Resource) => resource.type === selectedOption) ?? null
  }, [resources, selectedOption])
  const hourlyResource = useMemo(() => resources?.find((resource: Resource) => resource.type === "hourly") ?? null, [resources])
  const dailyResource = useMemo(() => resources?.find((resource: Resource) => resource.type === "daily") ?? null, [resources])
  const hourlyResourceLabel = useMemo(() => hourlyResource?.name?.trim() || t("Resource.hourly"), [hourlyResource?.name, t])
  const dailyResourceLabel = useMemo(() => dailyResource?.name?.trim() || t("Resource.daily"), [dailyResource?.name, t])
  const selectedResourceLabel = useMemo(
    () => selectedResource?.name?.trim() || t(`Resource.${selectedOption}`),
    [selectedOption, selectedResource?.name, t],
  )
  const selectedResourceDescription = useMemo(
    () => selectedResource?.description?.trim() || "",
    [selectedResource?.description],
  )

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
      map.set(formatBookingHourSlot(booking.startTime), booking)
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

    if (selectedOption === "hourly" && slot) {
      const [hourText] = slot.split(":")
      const hour = Number.parseInt(hourText, 10)
      setPendingHourlySelection({
        slot,
        startHour: hour,
        endHour: hour + 1,
      })
      setRecurringSelectedDates([new Date(selectedDate)])
      setIsRecurringEnabled(false)
      setBatchBookingResult(null)
    } else {
      setPendingHourlySelection(null)
      setRecurringSelectedDates([])
      setIsRecurringEnabled(false)
      setBatchBookingResult(null)
    }

    setPendingBookingData(payload)
    setIsConfirmBookingPanelOpen(true)
  }

  const handleConfirmBooking = async () => {
    if (!pendingBookingData) return

    try {
      if (selectedOption === "hourly" && isRecurringEnabled && pendingHourlySelection) {
        const uniqueDateKeys = new Set<string>()
        const batchSlots = recurringSelectedDates
          .map((date) => {
            const key = formatBookingDateKey(date)
            if (uniqueDateKeys.has(key)) return null
            uniqueDateKeys.add(key)
            const startTime = toSaoPauloUtcInstant(date, pendingHourlySelection.startHour)
            const endTime = toSaoPauloUtcInstant(date, pendingHourlySelection.endHour)
            return {
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
            }
          })
          .filter((slot): slot is { startTime: string; endTime: string } => Boolean(slot))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

        if (batchSlots.length === 0) {
          showToast("Selecione ao menos uma data para confirmar", "error")
          return
        }

        const result = await createBatchBooking({
          resourceId: pendingBookingData.resourceId,
          slots: batchSlots,
          needTablesAndChairs: false,
          ...(bookedOnBehalf ? { bookedOnBehalf } : {}),
        })

        setBatchBookingResult(result)
        await refreshBookings()
        await onBookingCreated()
        if (result.summary.created > 0) {
          showToast(
            result.summary.skipped > 0
              ? `${result.summary.created} reservas confirmadas. ${result.summary.skipped} não foram criadas.`
              : `${result.summary.created} reservas confirmadas.`,
            "success",
          )
        } else {
          showToast("Nenhuma data foi reservada.", "error")
        }
        setBookedOnBehalf("")
        return
      }

      await createBooking(pendingBookingData)
      await refreshBookings()
      await onBookingCreated()
      showToast(t("BookingCreatedSuccess"), "success")
      setNeedTablesAndChairs(false)
      setBookedOnBehalf("")
      setIsConfirmBookingPanelOpen(false)
      setPendingBookingData(null)
      setPendingHourlySelection(null)
      setRecurringSelectedDates([])
      setBatchBookingResult(null)
    } catch (error) {
      console.error("Error creating booking:", error)
      const message = error instanceof Error && error.message ? error.message : t("ErrorCreatingBooking")
      showToast(message, "error")
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

  const closeConfirmBookingPanel = useCallback(() => {
    setIsConfirmBookingPanelOpen(false)
    setPendingBookingData(null)
    setPendingHourlySelection(null)
    setRecurringSelectedDates([])
    setIsRecurringEnabled(false)
    setBatchBookingResult(null)
  }, [])

  const toggleRecurringDate = useCallback((date: Date) => {
    const dateKey = formatBookingDateKey(date)
    setRecurringSelectedDates((prev) => {
      const exists = prev.some((item) => formatBookingDateKey(item) === dateKey)
      if (exists) {
        if (prev.length === 1) return prev
        return prev.filter((item) => formatBookingDateKey(item) !== dateKey)
      }
      return [...prev, new Date(date)]
    })
  }, [])

  const removeRecurringDate = useCallback((dateKey: string) => {
    setRecurringSelectedDates((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((item) => formatBookingDateKey(item) !== dateKey)
    })
  }, [])

  const recurringDatesSorted = useMemo(
    () =>
      [...recurringSelectedDates].sort((a, b) => a.getTime() - b.getTime()),
    [recurringSelectedDates],
  )

  const rules = useMemo(() => {
    const content = t(`Card.${selectedOption === "hourly" ? "TennisContent" : "GrillContent"}`, {
      returnObjects: true,
    }) as string[]
    return content
  }, [selectedOption, t])

  const recurringButtonLabel = useMemo(() => {
    if (!(selectedOption === "hourly" && isRecurringEnabled)) {
      return "Confirmar reserva"
    }
    return `Confirmar ${recurringDatesSorted.length} reservas`
  }, [isRecurringEnabled, recurringDatesSorted.length, selectedOption])

  return (
    <section className="booking-section booking-scheduler">
      <div className="scheduler-tabs">
        <Button
          variant="secondary"
          className={selectedOption === "hourly" ? "selected" : ""}
          onClick={() => setSelectedOption("hourly")}
        >
          {hourlyResourceLabel}
        </Button>
        <Button
          variant="secondary"
          className={selectedOption === "daily" ? "selected" : ""}
          onClick={() => setSelectedOption("daily")}
        >
          {dailyResourceLabel}
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
              <SchedulerSlotsSkeleton />
            </div>
          ) : selectedOption === "hourly" ? (
            <div className="scheduler-slot-list">
              {timeSlots.map((slot) => {
                const booking = hourlyBookingByHour.get(slot.value)
                const reservedSlotInfo = reservedTimeDetails[slot.value]
                const isPast = isPastSlotForSelectedDate(slot.value)
                const isBooked = Boolean(booking) || unavailableTimes.includes(slot.value)
                const isBlocked = isPast || isBooked
                const canDelete = booking ? canDeleteBooking(booking) : false
                const isOwnBooking = booking
                  ? booking.userId === user?.id || isSameUnit(booking, user?.apartment, user?.block)
                  : reservedSlotInfo
                    ? reservedSlotInfo.userId === user?.id ||
                      (String(reservedSlotInfo.userApartment ?? "") === String(user?.apartment ?? "") &&
                        Number(reservedSlotInfo.userBlock) === Number(user?.block))
                  : false
                const reservedOnBehalf = reservedSlotInfo?.bookedOnBehalf?.trim()
                const tooltipContent = booking
                  ? bookingDetailsTooltip(booking)
                  : reservedSlotInfo?.userApartment && reservedSlotInfo?.userBlock
                    ? `Reservado pelo apt. ${reservedSlotInfo.userApartment} bl. ${reservedSlotInfo.userBlock}`
                    : null
                const shouldShowBookingInfo = Boolean(tooltipContent) && (!isOwnBooking || Boolean(booking?.bookedOnBehalf?.trim() || reservedOnBehalf))

                return (
                  <div key={slot.value} className={`scheduler-slot-row ${isBlocked ? "blocked" : ""}`.trim()}>
                    <div className="scheduler-slot-time">
                      <Clock3 size={15} />
                      <span>{slot.label}</span>
                    </div>

                    {booking ? (
                      <div className="scheduler-slot-actions">
                        <div className="scheduler-occupied-meta">
                          {/* <span className={`reservation-status ${isOwnBooking ? "confirmed" : "occupied"}`}>
                            {isOwnBooking ? "Confirmado" : "Ocupado"}
                          </span> */}
                          {shouldShowBookingInfo ? <Tooltip content={bookingDetailsTooltip(booking)} iconText="i" /> : null}
                        </div>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => setBookingToDelete(booking)}
                            className="scheduler-delete-icon-button"
                            disabled={isDeletingBooking}
                            aria-label="Cancelar reserva"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                    ) : isBooked ? (
                      <div className="scheduler-slot-actions">
                        <div className="scheduler-occupied-meta">
                          {/* <span className={`reservation-status ${isOwnBooking ? "confirmed" : "occupied"}`}>
                            {isOwnBooking ? "Confirmado" : "Ocupado"}
                          </span> */}
                          {shouldShowBookingInfo && tooltipContent ? <Tooltip content={tooltipContent} iconText="i" /> : null}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isBlocked}
                        onClick={() => {
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
              {(() => {
                const isOwnDailyBooking = dailyBooking.userId === user?.id || isSameUnit(dailyBooking, user?.apartment, user?.block)
                const shouldShowDailyInfo = !isOwnDailyBooking || Boolean(dailyBooking.bookedOnBehalf?.trim())
                return (
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
                <div className="scheduler-occupied-meta">
                  {/* <span className={`reservation-status ${isOwnDailyBooking ? "confirmed" : "occupied"}`}>
                    {isOwnDailyBooking ? "Confirmado" : "Ocupado"}
                  </span> */}
                  {shouldShowDailyInfo ? <Tooltip content={bookingDetailsTooltip(dailyBooking)} iconText="i" /> : null}
                </div>
              </div>
                )
              })()}
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
              reservedDayDetails={selectedOption === "daily" ? reservedDayDetails : {}}
              onDateSelect={setSelectedDate}
              resourceType={selectedOption}
              selectedDate={selectedDate}
            />
          </div>
          <div className="scheduler-side-card scheduler-resource-card">
            <h4>{selectedResourceLabel}</h4>
            {selectedResourceDescription ? <p>{selectedResourceDescription}</p> : null}
          </div>
        </aside>
      </div>

      <section className="scheduler-rules">
        <h3>Regras de Uso - {selectedResourceLabel}</h3>
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

      <Drawer isOpen={isConfirmBookingPanelOpen} onClose={closeConfirmBookingPanel} closeButton={false}>
        <div className="booking-confirm-panel">
          <div className="booking-confirm-panel-header">
            <h2>{batchBookingResult ? "Reserva confirmada" : "Confirmar reserva"}</h2>
            <button type="button" className="booking-confirm-panel-close" onClick={closeConfirmBookingPanel} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          {!batchBookingResult ? (
            <>
              <div className="booking-confirm-panel-subtitle">
                {selectedResourceLabel}{" "}
                {pendingBookingData
                  ? `- ${formatPanelTimeRange(pendingBookingData.startTime, pendingBookingData.endTime)}`
                  : ""}
              </div>

              <div className="booking-confirm-base-card">
                <div>
                  <strong>
                    {pendingBookingData ? formatPanelDateLabel(new Date(pendingBookingData.startTime)) : ""}
                  </strong>
                  <div className="booking-confirm-base-time">
                    {pendingBookingData ? formatPanelTimeRange(pendingBookingData.startTime, pendingBookingData.endTime) : ""}
                  </div>
                </div>
                <span className="booking-confirm-chip-available">Disponível</span>
              </div>

              {selectedOption === "hourly" && pendingHourlySelection ? (
                <>
                  <div className="booking-recurring-toggle-row">
                    <div className="booking-recurring-toggle-label">
                      <RefreshCw size={14} />
                      <div>
                        <strong>Reserva recorrente</strong>
                        <small>Selecione múltiplas datas com o mesmo horário</small>
                      </div>
                    </div>
                    <label className="booking-switch">
                      <input
                        type="checkbox"
                        checked={isRecurringEnabled}
                        onChange={(event) => {
                          const nextValue = event.target.checked
                          setIsRecurringEnabled(nextValue)
                          if (!nextValue) {
                            setRecurringSelectedDates([new Date(selectedDate)])
                          } else if (recurringSelectedDates.length === 0) {
                            setRecurringSelectedDates([new Date(selectedDate)])
                          }
                        }}
                      />
                      <span className="booking-switch-slider"></span>
                    </label>
                  </div>

                  {isRecurringEnabled ? (
                    <div className="booking-recurring-section">
                      <h4>Selecione as datas</h4>
                      <p>Datas com conflito serão ignoradas no momento da confirmação.</p>

                      <div className="booking-recurring-calendar-wrapper">
                        <Calendar
                          reservedDays={[]}
                          reservedDayDetails={{}}
                          onDateSelect={() => undefined}
                          selectedDate={selectedDate}
                          resourceType="hourly"
                          allowMultipleSelection={true}
                          selectedDates={recurringDatesSorted}
                          onDateToggle={toggleRecurringDate}
                          allowReservedSelection={true}
                        />
                      </div>

                      <div className="booking-recurring-selected-block">
                        <h5>Datas selecionadas ({recurringDatesSorted.length})</h5>
                        <div className="booking-recurring-selected-list">
                          {recurringDatesSorted.map((date) => {
                            const dateKey = formatBookingDateKey(date)
                            return (
                              <div key={dateKey} className="booking-recurring-selected-item">
                                <span>
                                  {formatPanelDateLabel(date)} {String(pendingHourlySelection.startHour).padStart(2, "0")}:00-{String(pendingHourlySelection.endHour).padStart(2, "0")}:00h
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeRecurringDate(dateKey)}
                                  disabled={recurringDatesSorted.length === 1}
                                  aria-label={`Remover data ${dateKey}`}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="booking-confirm-panel-actions">
                <Button
                  variant="primary"
                  fullWidth={true}
                  onClick={handleConfirmBooking}
                  disabled={isCreatingBooking || isCreatingBatchBooking}
                  isLoading={isCreatingBooking || isCreatingBatchBooking}
                >
                  {recurringButtonLabel}
                </Button>
                <Button variant="link" fullWidth={true} onClick={closeConfirmBookingPanel}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="booking-confirm-result">
              <div className="booking-confirm-result-summary">
                <h3>{batchBookingResult.summary.created} reservas realizadas!</h3>
                <p>
                  {batchBookingResult.summary.skipped > 0
                    ? `${batchBookingResult.summary.skipped} datas não foram criadas por conflito.`
                    : "Todas as datas foram reservadas com sucesso."}
                </p>
              </div>

              <div className="booking-confirm-result-list">
                {batchBookingResult.created.map((item) => (
                  <div key={item.id} className="booking-confirm-result-item success">
                    <span>{formatPanelResultDate(item.startTime)}</span>
                    <span>{formatPanelTimeRange(item.startTime, item.endTime)}</span>
                  </div>
                ))}
                {batchBookingResult.skipped.map((item) => (
                  <div key={`${item.startTime}-${item.endTime}`} className="booking-confirm-result-item skipped">
                    <div>
                      <span>{formatPanelResultDate(item.startTime)}</span>
                      <small>{item.reason}</small>
                    </div>
                    <span>{formatPanelTimeRange(item.startTime, item.endTime)}</span>
                  </div>
                ))}
              </div>

              <div className="booking-confirm-panel-actions">
                <Button variant="primary" fullWidth={true} onClick={closeConfirmBookingPanel}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

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
