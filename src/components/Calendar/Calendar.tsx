"use client"

import type React from "react"
import { useState, useMemo } from "react"
import "./Calendar.css"

interface CalendarProps {
  availableDates: Date[]
  unavailableDates: Date[]
  onDateSelect: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = ({ availableDates, unavailableDates, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const maxDate = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return formatDateForInput(date)
  }, [])

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.target.value + "T00:00:00")
    setSelectedDate(date)
    onDateSelect(date)
  }

  return (
    <div className="calendar">
      <input
        type="date"
        onChange={handleDateChange}
        className="calendar-input"
        min={formatDateForInput(new Date())}
        max={maxDate}
        placeholder="dd / mm / yyyy"
      />
    </div>
  )
}

export default Calendar

