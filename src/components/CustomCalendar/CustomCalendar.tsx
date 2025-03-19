"use client"

import type React from "react"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "./CustomCalendar.css"

interface CustomCalendarProps {
  reservedDays?: string[]
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  resourceType?: "grill" | "tennis"
  selectedDate?: Date | null
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  reservedDays = [],
  onDateSelect,
  minDate = new Date(),
  maxDate,
  resourceType = "grill",
  selectedDate = null,
}) => {
  const { t } = useTranslation()

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(selectedDate)

  useEffect(() => {
    setInternalSelectedDate(selectedDate)
  }, [selectedDate])

  const reservedDaysSet = new Set(reservedDays)

  const defaultMaxDate = new Date()
  defaultMaxDate.setMonth(defaultMaxDate.getMonth() + 3)
  const effectiveMaxDate = maxDate || defaultMaxDate

  useEffect(() => {
    if (selectedDate) {
      const selectedMonth = selectedDate.getMonth()
      const selectedYear = selectedDate.getFullYear()
      const currentViewMonth = currentMonth.getMonth()
      const currentViewYear = currentMonth.getFullYear()

      if (selectedMonth !== currentViewMonth || selectedYear !== currentViewYear) {
        setCurrentMonth(new Date(selectedYear, selectedMonth, 1))
      }
    }
  }, [selectedDate, currentMonth])

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatDateString = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const isDateReserved = (date: Date): boolean => {
    return reservedDaysSet.has(formatDateString(date))
  }

  const isDateOutOfRange = (date: Date): boolean => {
    const dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const minWithoutTime = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    const maxWithoutTime = new Date(
      effectiveMaxDate.getFullYear(),
      effectiveMaxDate.getMonth(),
      effectiveMaxDate.getDate(),
    )

    return dateWithoutTime < minWithoutTime || dateWithoutTime > maxWithoutTime
  }

  const isDateSelected = (date: Date): boolean => {
    if (!internalSelectedDate) return false

    return (
      date.getDate() === internalSelectedDate.getDate() &&
      date.getMonth() === internalSelectedDate.getMonth() &&
      date.getFullYear() === internalSelectedDate.getFullYear()
    )
  }

  const handleDateClick = (date: Date) => {
    if (isDateReserved(date) || isDateOutOfRange(date)) {
      return
    }

    setInternalSelectedDate(date)
    onDateSelect(date)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() - 1)

      const currentDate = new Date()
      if (
        newMonth.getFullYear() < currentDate.getFullYear() ||
        (newMonth.getFullYear() === currentDate.getFullYear() && newMonth.getMonth() < currentDate.getMonth())
      ) {
        return prevMonth
      }

      return newMonth
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() + 1)

      if (
        newMonth.getFullYear() > effectiveMaxDate.getFullYear() ||
        (newMonth.getFullYear() === effectiveMaxDate.getFullYear() && newMonth.getMonth() > effectiveMaxDate.getMonth())
      ) {
        return prevMonth
      }

      return newMonth
    })
  }

  const formatMonthName = (date: Date): string => {
    return date.toLocaleString("default", { month: "long", year: "numeric" })
  }

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = formatDateString(date)
      const isReserved = isDateReserved(date)
      const isOutOfRange = isDateOutOfRange(date)
      const isSelected = isDateSelected(date)

      const className = `calendar-day ${isReserved ? "reserved" : ""} ${isOutOfRange ? "out-of-range" : ""} ${isSelected ? "selected" : ""}`

      days.push(
        <div key={day} className={className} onClick={() => handleDateClick(date)}>
          {day}
        </div>,
      )
    }

    return days
  }

  return (
    <div className="custom-calendar">
      <div className="calendar-header">
        <button className="month-nav-button" onClick={goToPreviousMonth} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <div className="current-month">{formatMonthName(currentMonth)}</div>
        <button className="month-nav-button" onClick={goToNextMonth} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        <div className="weekday">Sun</div>
        <div className="weekday">Mon</div>
        <div className="weekday">Tue</div>
        <div className="weekday">Wed</div>
        <div className="weekday">Thu</div>
        <div className="weekday">Fri</div>
        <div className="weekday">Sat</div>
      </div>

      <div className="calendar-grid">{renderCalendarDays()}</div>

      {resourceType === "grill" && (
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>{t("TimeSlot.Available")}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color reserved"></div>
            <span>{t("TimeSlot.Booked")}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomCalendar

