"use client"

import type React from "react"

import { useTranslation } from "react-i18next"
import { BOOKING_DISPLAY_TIMEZONE } from "../../utils/booking-datetime"
import "./TimeSlotSelector.css"

interface TimeSlotSelectorProps {
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  resourceType: "tennis" | "grill"
  selectedDate?: Date | null
  unavailableSlots?: string[]
  isLoading?: boolean
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedTime,
  onTimeSelect,
  resourceType,
  selectedDate = null,
  unavailableSlots = [],
  isLoading = false,
}) => {
  const { t } = useTranslation()

  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7
    return {
      value: `${hour.toString().padStart(2, "0")}:00`,
      label: `${hour}:00 - ${hour + 1}:00`,
    }
  })

  const handleTimeSlotChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onTimeSelect(event.target.value)
  }

  const isPastSlotForSelectedDate = (slot: string) => {
    if (!selectedDate || resourceType !== "tennis") {
      return false
    }

    const now = new Date()
    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: BOOKING_DISPLAY_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const selectedDayKey = dayFormatter.format(selectedDate)
    const todayKey = dayFormatter.format(now)
    if (selectedDayKey !== todayKey) {
      return false
    }

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

  const isSlotDisabled = (slot: string) => {
    if (resourceType === "tennis") {
      return unavailableSlots.includes(slot) || isPastSlotForSelectedDate(slot)
    }
    return false
  }

  const getSlotClassName = (slot: string) => {
    if (unavailableSlots.includes(slot) || isPastSlotForSelectedDate(slot)) {
      return "past"
    }
    return "available"
  }

  return (
    <div className="time-slot-selector">
      <label>{t("SelectTime")}</label>
      {isLoading ? (
        <div className="loading-indicator">{t("Loading")}</div>
      ) : (
        <select value={selectedTime || ""} onChange={handleTimeSlotChange} className="time-select">
          <option value="">{t("SelectTimeOption")}</option>
          {timeSlots.map((slot) => (
            <option
              key={slot.value}
              value={slot.value}
              disabled={isSlotDisabled(slot.value)}
              className={getSlotClassName(slot.value)}
            >
              {slot.label} {isSlotDisabled(slot.value) ? `(${t("TimeSlot.Booked")})` : ""}
            </option>
          ))}
        </select>
      )}

      <div className="time-slot-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>{t("TimeSlot.Available")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked"></div>
          <span>{t("TimeSlot.Booked")}</span>
        </div>
      </div>
    </div>
  )
}

export default TimeSlotSelector
