"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { BookingList, BookingSection, LoadingSpinner } from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useToast } from "../../context/ToastContext"
import "./Home.css"

const Home = () => {
  // Add render counter for debugging
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[Home] Render count: ${renderCount.current}`)

  // Add a throttle mechanism to prevent excessive renders
  const lastRenderTime = useRef(Date.now())
  const shouldRender = useRef(true)

  // If we're rendering too frequently, skip some renders
  const now = Date.now()
  if (now - lastRenderTime.current < 100) {
    shouldRender.current = false
    console.log(`[Home] Throttling render, skipping...`)
  } else {
    shouldRender.current = true
    lastRenderTime.current = now
  }

  const { user, token } = useAuth()
  const { t } = useTranslation()
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])
  const { showToast } = useToast()

  const {
    bookings: bookingsData,
    total,
    currentPage,
    lastPage,
    isLoading: isBookingsLoading,
    isError: bookingsError,
    currentLimit,
    currentSort,
    currentOrder,
    changePage,
    changeLimit,
    changeSort,
    changeOrder,
    refreshBookings,
  } = useAllBookings(token ?? "")

  useEffect(() => {
    console.log(`[Home] Processing bookings data effect, bookingsData length: ${bookingsData?.length || 0}`)
    if (bookingsData && shouldRender.current) {
      const unavailable = bookingsData.map((booking: any) => new Date(booking.startTime))
      setUnavailableDates(unavailable)
    }
  }, [bookingsData])

  // Memoize handleBookingDeleted to prevent recreation on every render
  const handleBookingDeleted = useCallback(
    async (bookingId: string) => {
      console.log(`[Home] Booking deleted: ${bookingId}`)
      await refreshBookings()
      showToast(t("BookingList.DeleteSuccess"), "success")
    },
    [refreshBookings, showToast, t],
  )

  const handleBookingCreated = useCallback(async () => {
    console.log(`[Home] Booking created`)
    await refreshBookings()
    showToast(t("BookingCreatedSuccess"), "success")
  }, [refreshBookings, showToast, t])


  const handleBookingError = useCallback(
    (errorMessage: string) => {
      console.log(`[Home] Booking error: ${errorMessage}`)
      showToast(errorMessage, "error")
    },
    [showToast],
  )

  useEffect(() => {
    console.log(`[Home] Booking error effect, error: ${bookingsError ? "yes" : "no"}`)
    if (bookingsError && shouldRender.current) {
      showToast(t("ErrorLoadingBookings"), "error")
    }
  }, [bookingsError, showToast, t])

  return (
    <div className="home">
      <h1>
        {t("Welcome")}, {user?.name}
      </h1>
      <div className="home-content">
        <div className="booking-section-container">
          {token && user && (
            <BookingSection
              token={token}
              unavailableDates={unavailableDates}
              userId={user.id}
              onBookingCreated={handleBookingCreated}
              onBookingError={handleBookingError}
            />
          )}
        </div>
        <div className="booking-list-container">
          {isBookingsLoading ? (
            <LoadingSpinner />
          ) : bookingsData ? (
            <BookingList
              bookings={bookingsData}
              total={total}
              currentPage={currentPage}
              lastPage={lastPage}
              currentLimit={currentLimit}
              currentSort={currentSort}
              currentOrder={currentOrder}
              onBookingDeleted={handleBookingDeleted}
              onChangePage={changePage}
              onChangeLimit={changeLimit}
              onChangeSort={changeSort}
              onChangeOrder={changeOrder}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Home

