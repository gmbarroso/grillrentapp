"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import { Modal, LoadingSpinner, Tooltip } from "../"
import { useToast } from "../../context/ToastContext"
import { Trash2, ChevronUp, ChevronDown } from "lucide-react"
import "./BookingList.css"
import type { Booking, BookingListProps } from "../../types/Booking"

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  total,
  currentPage,
  lastPage,
  currentLimit,
  currentSort,
  currentOrder,
  onBookingDeleted,
  onChangePage,
  onChangeLimit,
  onChangeSort,
  onChangeOrder,
}) => {
  // Filter out past bookings
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Set to beginning of today

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.startTime)
    return bookingDate >= now
  })

  console.log("lalalala", filteredBookings)
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const { deleteBooking, isLoading } = useDeleteBooking(token ?? "")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleDeleteClick = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = useCallback(async () => {
    if (selectedBookingId) {
      const { success, error } = await deleteBooking(selectedBookingId)
      if (success) {
        onBookingDeleted(selectedBookingId)
        showToast(t("BookingList.DeleteSuccess"), "success")
      } else {
        console.error("Error deleting booking:", error)
        showToast(t("BookingList.DeleteError"), "error")
      }
    }
    setIsModalOpen(false)
    setSelectedBookingId(null)
  }, [selectedBookingId, deleteBooking, onBookingDeleted, showToast, t])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedBookingId(null)
  }, [])

  const handleSortChange = (column: string) => {
    if (currentSort === column) {
      onChangeOrder(currentOrder === "ASC" ? "DESC" : "ASC")
    } else {
      onChangeSort(column)
      onChangeOrder("ASC")
    }
  }

  const canDeleteBooking = (booking: Booking) => {
    if (user?.role === "admin") return true
    if (user?.role === "resident" && booking.userId === user.id) return true
    return false
  }

  const formatTimeInterval = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const startHour = start.getHours()
    const endHour = end.getHours()
    return `${startHour}h - ${endHour}h`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const renderSortIndicator = (column: string) => {
    if (currentSort === column) {
      return currentOrder === "ASC" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
    }
    return null
  }

  return (
    <div className="booking-list">
      <h3>{t("BookingList.Title")}</h3>
      {filteredBookings.length === 0 ? (
        <div className="no-bookings-message">{t("BookingList.NoBookings")}</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSortChange("resourceType")} className="sortable-column">
                  <div className="column-header">
                    {t("BookingList.ResourceType")}
                    {renderSortIndicator("resourceType")}
                  </div>
                </th>
                <th onClick={() => handleSortChange("startTime")} className="sortable-column">
                  <div className="column-header">
                    {t("BookingList.Date")}
                    {renderSortIndicator("startTime")}
                  </div>
                </th>
                <th onClick={() => handleSortChange("startTime")} className="sortable-column">
                  <div className="column-header">
                    {t("BookingList.Time")}
                    {renderSortIndicator("startTime")}
                  </div>
                </th>
                <th onClick={() => handleSortChange("userApartment")} className="sortable-column">
                  <div className="column-header">
                    {t("BookingList.Apartment")}
                    {renderSortIndicator("userApartment")}
                  </div>
                </th>
                <th className="action-column"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="resource-with-tooltip">
                      {t(`Resource.${booking.resourceType}`)}
                      {booking.resourceType === "grill" && booking.needTablesAndChairs && (
                        <Tooltip content={t("BookingList.TablesAndChairsIncluded")} />
                      )}
                    </div>
                  </td>
                  <td>{formatDate(booking.startTime)}</td>
                  <td>
                    {booking.resourceType === "grill"
                      ? t("BookingList.AllDay")
                      : formatTimeInterval(booking.startTime, booking.endTime)}
                  </td>
                  <td>
                    <div className="apartment-with-tooltip">
                      {`${booking.userApartment} bl. ${booking.userBlock}`}
                      {booking.bookedOnBehalf && (
                        <Tooltip content={t("BookingList.BookedOnBehalf", { apartment: booking.bookedOnBehalf })} />
                      )}
                    </div>
                  </td>
                  <td className="action-column">
                    {canDeleteBooking(booking) && (
                      <button
                        onClick={() => handleDeleteClick(booking.id)}
                        className="delete-button"
                        aria-label={t("BookingList.Delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => onChangePage(currentPage - 1)} disabled={currentPage === 1}>
              {t("BookingList.PreviousPage")}
            </button>
            <span>{t("BookingList.PageInfo", { current: currentPage, total: lastPage })}</span>
            <button onClick={() => onChangePage(currentPage + 1)} disabled={currentPage === lastPage}>
              {t("BookingList.NextPage")}
            </button>
            <select value={currentLimit} onChange={(e) => onChangeLimit(Number(e.target.value))}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </div>
        </>
      )}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2>{t("BookingList.ConfirmDeleteTitle")}</h2>
        <p>{t("BookingList.ConfirmDeleteMessage")}</p>
        <div className="modal-actions">
          {isLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <button onClick={handleConfirmDelete} className="confirm-delete-button">
                {t("BookingList.ConfirmDelete")}
              </button>
              <button onClick={handleCloseModal} className="cancel-button">
                {t("BookingList.CancelDelete")}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default BookingList

