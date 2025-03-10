"use client"

import type React from "react"

import { useTranslation } from "react-i18next"
import "./TimeSlotSelector.css"

interface TimeSlotSelectorProps {
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  resourceType: "tennis" | "grill"
  unavailableSlots?: string[]
  userBookedSlots?: string[]
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedTime,
  onTimeSelect,
  resourceType,
  unavailableSlots = [],
  userBookedSlots = [],
}) => {
  const { t } = useTranslation()

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7
    return {
      value: `${hour.toString().padStart(2, "0")}:00`,
      label: `${hour}:00 - ${hour + 1}:00`,
    }
  })
  
  const handleTimeSlotChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onTimeSelect(event.target.value)
  }

  const isSlotDisabled = (slot: string) => {
    if (resourceType === "tennis") {
      if (userBookedSlots.length >= 2) {
        return !userBookedSlots.includes(slot)
      }
      return unavailableSlots.includes(slot)
    }
    return false
  }

  return (
    <div className="time-slot-selector">
      <label>{t("SelectTime")}</label>
      <select value={selectedTime || ""} onChange={handleTimeSlotChange} className="time-select">
        <option value="">{t("SelectTimeOption")}</option>
        {timeSlots.map((slot) => (
          <option key={slot.value} value={slot.value} disabled={isSlotDisabled(slot.value)}>
            {slot.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TimeSlotSelector

