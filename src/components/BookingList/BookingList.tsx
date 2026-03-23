"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import { Modal, Tooltip, Button, Skeleton } from "../"
import { useToast } from "../../context/ToastContext"
import { Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { formatBookingDate, formatBookingTimeInterval } from "../../utils/booking-datetime"
import "./BookingList.css"
import type { Booking, BookingListProps } from "../../types"

const BookingList: React.FC<BookingListProps> = ({
  bookings,
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
        onBookingDeleted()
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

  const renderSortIndicator = (column: string) => {
    if (currentSort === column) {
      return currentOrder === "ASC" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
    }
    return null
  }

  return (
    <div className="booking-list">
      <h3>{t("BookingList.Title")}</h3>
      {bookings.length === 0 ? (
        <div className="no-bookings-message">{t("BookingList.NoBookings")}</div>
      ) : (
        <>
          <div className="booking-list-wrapper">
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
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={booking.userId === user?.id ? "user-reservation" : ""}
                  >
                    <td>
                      <div className="resource-with-tooltip">
                        {t(`Resource.${booking.resourceType}`)}
                        {booking.resourceType === "daily" && booking.needTablesAndChairs && (
                          <Tooltip content={t("BookingList.TablesAndChairsIncluded")} />
                        )}
                      </div>
                    </td>
                    <td>{formatBookingDate(booking.startTime)}</td>
                    <td>
                      {booking.resourceType === "daily"
                        ? t("BookingList.AllDay")
                        : formatBookingTimeInterval(booking.startTime, booking.endTime)}
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
          </div>
          <div className="pagination">
            <Button variant="secondary" onClick={() => onChangePage(currentPage - 1)} disabled={currentPage === 1}>
              {t("BookingList.PreviousPage")}
            </Button>
            <span>{t("BookingList.PageInfo", { current: currentPage, total: lastPage })}</span>
            <Button
              variant="secondary"
              onClick={() => onChangePage(currentPage + 1)}
              disabled={currentPage === lastPage}
            >
              {t("BookingList.NextPage")}
            </Button>
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
              <Skeleton width="100%" height={38} borderRadius={8} />
            </div>
          ) : (
            <>
              <Button variant="danger" onClick={handleConfirmDelete}>
                {t("BookingList.ConfirmDelete")}
              </Button>
              <Button variant="secondary" onClick={handleCloseModal}>
                {t("BookingList.CancelDelete")}
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default BookingList
