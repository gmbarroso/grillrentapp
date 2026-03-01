"use client"

import { useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { BookingList, BookingSection, LoadingSpinner } from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import { useToast } from "../../context/ToastContext"
import "./Home.css"

const Home = () => {
  const { user, token } = useAuth()
  const { t } = useTranslation()
  const { showToast } = useToast()

  const {
    bookings: bookingsData,
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
  } = useAllBookings()

  // Memoize handleBookingDeleted to prevent recreation on every render
  const handleBookingDeleted = useCallback(
    async () => {
      await refreshBookings()
    },
    [refreshBookings],
  )

  const handleBookingCreated = useCallback(async () => {
    await refreshBookings()
  }, [refreshBookings])

  useEffect(() => {
    if (bookingsError) {
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
              onBookingCreated={handleBookingCreated}
            />
          )}
        </div>
        <div className="booking-list-container">
          {isBookingsLoading ? (
            <LoadingSpinner />
          ) : bookingsData ? (
            <BookingList
              bookings={bookingsData}
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
