import type React from "react"
import { useMemo } from "react"
import CustomCalendar from "../CustomCalendar/CustomCalendar"
import type { ReservedSlotInfo } from "../../hooks/booking/useReservedTimes"
import "./Calendar.css"

interface CalendarProps {
  availableDates?: Date[]
  unavailableDates?: Date[]
  reservedDays?: string[]
  reservedDayDetails?: Record<string, ReservedSlotInfo>
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  resourceType?: "daily" | "hourly"
  selectedDate?: Date | null
  allowMultipleSelection?: boolean
  selectedDates?: Date[]
  onDateToggle?: (date: Date) => void
  allowReservedSelection?: boolean
}

const Calendar: React.FC<CalendarProps> = ({
  unavailableDates = [],
  reservedDays,
  reservedDayDetails = {},
  onDateSelect,
  minDate,
  maxDate,
  resourceType = "daily",
  selectedDate = null,
  allowMultipleSelection = false,
  selectedDates = [],
  onDateToggle,
  allowReservedSelection = false,
}) => {
  const normalizedReservedDays = useMemo(() => {
    if (reservedDays) return reservedDays
    return unavailableDates.map((date) => date.toISOString().split("T")[0])
  }, [reservedDays, unavailableDates])

  return (
    <div className="calendar calendar-widget">
      <CustomCalendar
        reservedDays={normalizedReservedDays}
        reservedDayDetails={reservedDayDetails}
        onDateSelect={onDateSelect}
        minDate={minDate}
        maxDate={maxDate}
        resourceType={resourceType}
        selectedDate={selectedDate}
        allowMultipleSelection={allowMultipleSelection}
        selectedDates={selectedDates}
        onDateToggle={onDateToggle}
        allowReservedSelection={allowReservedSelection}
      />
    </div>
  )
}

export default Calendar
