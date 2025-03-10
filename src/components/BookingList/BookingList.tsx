"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import { Modal } from "../"
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
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const { deleteBooking } = useDeleteBooking(token ?? "")
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

  return (
    <div className="booking-list">
      <h3>{t("BookingList.Title")}</h3>
      {bookings.length === 0 ? (
        <div className="no-bookings-message">{t("BookingList.NoBookings")}</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSortChange("resourceType")}>
                  {t("BookingList.ResourceType")}
                  {currentSort === "resourceType" &&
                    (currentOrder === "ASC" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </th>
                <th onClick={() => handleSortChange("startTime")}>
                  {t("BookingList.Date")}
                  {currentSort === "startTime" &&
                    (currentOrder === "ASC" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </th>
                <th onClick={() => handleSortChange("startTime")}>
                  {t("BookingList.Time")}
                  {currentSort === "startTime" &&
                    (currentOrder === "ASC" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </th>
                <th onClick={() => handleSortChange("apartment")}>
                  {t("BookingList.Apartment")}
                  {currentSort === "apartment" &&
                    (currentOrder === "ASC" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                </th>
                <th className="action-column"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{t(`Resource.${booking.resourceType}`)}</td>
                  <td>{formatDate(booking.startTime)}</td>
                  <td>
                    {booking.resourceType === "grill"
                      ? t("BookingList.AllDay")
                      : formatTimeInterval(booking.startTime, booking.endTime)}
                  </td>
                  <td>{booking.userApartment}</td>
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
            </select>
          </div>
        </>
      )}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2>{t("BookingList.ConfirmDeleteTitle")}</h2>
        <p>{t("BookingList.ConfirmDeleteMessage")}</p>
        <div className="modal-actions">
          <button onClick={handleConfirmDelete} className="confirm-delete-button">
            {t("BookingList.ConfirmDelete")}
          </button>
          <button onClick={handleCloseModal} className="cancel-button">
            {t("BookingList.CancelDelete")}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default BookingList

