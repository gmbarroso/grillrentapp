import type React from "react"
import { useState } from "react"
import "./Calendar.css"

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(event.target.value))
    setBookingError(null)
  }

  const handleBooking = () => {
    if (!selectedDate) {
      setBookingError("Please select a date")
      return
    }

    const today = new Date()
    if (selectedDate < today) {
      setBookingError("Cannot book a date in the past")
      return
    }

    // Here you would typically make an API call to book the grill
    console.log(`Booking for date: ${selectedDate.toDateString()}`)
    alert(`Booking confirmed for ${selectedDate.toDateString()}`)
  }

  return (
    <div className="calendar">
      <input type="date" onChange={handleDateChange} className="calendar-input" />
      <button onClick={handleBooking} className="book-button">
        Book Grill
      </button>
      {bookingError && <p className="error-message">{bookingError}</p>}
    </div>
  )
}

export default Calendar

