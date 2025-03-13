"use client"

import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import Calendar from "../Calendar/Calendar"
import { LoadingSpinner, Modal } from "../"
import TimeSlotSelector from "../TimeSlotSelector/TimeSlotSelector"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useCreateBooking } from "../../hooks/booking/useCreateBooking"
import { useToast } from "../../context/ToastContext"
import { useAuth } from "../../context/AuthContext"
import "./BookingSection.css"
import type { Resource } from "../../types/Resource"
import type { BookingSectionProps } from "../../types/Booking"

interface ExtendedBookingSectionProps extends BookingSectionProps {
  onBookingCreated: () => void
  onBookingError: (errorMessage: string) => void
}

const BookingSection: React.FC<ExtendedBookingSectionProps> = ({
  token,
  unavailableDates,
  onBookingCreated,
  onBookingError,
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [selectedOption, setSelectedOption] = useState<"grill" | "tennis" | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(null)
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [userBookedSlots, setUserBookedSlots] = useState<string[]>([])
  const [needTablesAndChairs, setNeedTablesAndChairs] = useState(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)

  const { data: resources, isLoading: isResourcesLoading, error: resourcesError } = useAllResources(token)
  const { createBooking, isLoading: isCreatingBooking, error: createBookingError } = useCreateBooking(token)

  const selectedResource = selectedOption ? resources?.find((r: Resource) => r.type === selectedOption) : null

  const handleOptionSelect = (option: "grill" | "tennis") => {
    setSelectedOption(option)
    setSelectedDate(null)
    setSelectedTime(null)
    setIsDateAvailable(null)
    setUnavailableSlots([])
    setUserBookedSlots([])
    setNeedTablesAndChairs(false)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setIsDateAvailable(null)
    setUnavailableSlots([])
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleTablesAndChairsChange = () => {
    setIsAgreementModalOpen(true)
  }

  const handleAgreementConfirm = () => {
    setNeedTablesAndChairs(true)
    setIsAgreementModalOpen(false)
  }

  const handleAgreementCancel = () => {
    setNeedTablesAndChairs(false)
    setIsAgreementModalOpen(false)
  }

  const handleConfirmDate = async () => {
    if (selectedResource && selectedDate) {
      const now = new Date()
      const startTime = new Date(selectedDate)
      const endTime = new Date(selectedDate)

      if (selectedOption === "tennis" && selectedTime) {
        const [hours] = selectedTime.split(":")
        startTime.setHours(Number.parseInt(hours, 10), 0, 0, 0)
        endTime.setHours(startTime.getHours() + 1, 0, 0, 0)
      } else {
        startTime.setHours(7, 0, 0, 0)
        endTime.setHours(22, 0, 0, 0)
      }

      if (startTime.toDateString() === now.toDateString() && selectedOption === "grill") {
        const currentHour = now.getHours()
        if (currentHour >= 7 && currentHour < 22) {
          startTime.setHours(currentHour + 1, 0, 0, 0)
        } else if (currentHour >= 22) {
          showToast(t("ErrorBookingClosedForToday"), "error")
          return
        }
      }

      try {
        const bookingData = {
          resourceId: selectedResource.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          needTablesAndChairs: selectedOption === "grill" ? needTablesAndChairs : false,
        }
        await createBooking(bookingData)
        setIsDateAvailable(true)
        onBookingCreated()
        showToast(t("BookingCreatedSuccess"), "success")
        setSelectedDate(null)
        setSelectedTime(null)
        setNeedTablesAndChairs(false)
        setSelectedOption(null)
        setIsDateAvailable(null)
        setUnavailableSlots([])
        setUserBookedSlots([])
      } catch (error) {
        console.error("Error creating booking:", error)
        setIsDateAvailable(false)
        onBookingError(t("ErrorCreatingBooking"))
        showToast(t("ErrorCreatingBooking"), "error")
      }
    }
  }

  const handleRulesForEachResource = (option: "grill" | "tennis") => {
    const title = t(`Card.${option === "tennis" ? "TennisTitle" : "GrillTitle"}`)
    const content = t(`Card.${option === "tennis" ? "TennisContent" : "GrillContent"}`, {
      returnObjects: true,
    }) as string[]

    return (
      <div>
        <h3 className="card-title">{title}</h3>
        <ul className="card-content">
          {content.map((item, index) => (
            <li className="agreement-terms li" key={index}>{item}</li>
          ))}
        </ul>
      </div>
    )
  }

  const canConfirmBooking = () => {
    if (selectedOption === "tennis") {
      return selectedDate && selectedTime
    }
    return selectedDate
  }

  if (resourcesError) {
    showToast(t("ErrorLoadingResources"), "error")
  }

  return (
    <section className="booking-section">
      <h2>{t("ChooseRent")}</h2>
      <div className="options">
        {isResourcesLoading ? (
          <LoadingSpinner />
        ) : resources ? (
          resources.map((resource: Resource) => (
            <button
              key={resource.id}
              className={`option ${selectedOption === resource.type ? "selected" : ""}`}
              onClick={() => handleOptionSelect(resource.type)}
            >
              {t(`Resource.${resource.type}`)}
            </button>
          ))
        ) : null}
      </div>
      {selectedOption && (
        <div className="calendar-section">
          <Calendar
            key={selectedOption}
            availableDates={[]}
            unavailableDates={unavailableDates}
            onDateSelect={handleDateSelect}
          />

          {selectedDate && selectedOption === "grill" && (
            <div className="tables-chairs-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={needTablesAndChairs}
                  onChange={handleTablesAndChairsChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">{t("NeedTablesAndChairs")}</span>
              </label>
            </div>
          )}

          {selectedDate && selectedOption === "tennis" && (
            <TimeSlotSelector
              selectedTime={selectedTime}
              onTimeSelect={handleTimeSelect}
              resourceType={selectedOption}
              unavailableSlots={unavailableSlots}
              userBookedSlots={userBookedSlots}
            />
          )}

          {selectedDate && canConfirmBooking() && (
            <button onClick={handleConfirmDate} disabled={isCreatingBooking} className="confirm-date-button">
              {t("ConfirmDate")}
            </button>
          )}

          {isCreatingBooking && <LoadingSpinner />}
        </div>
      )}
      {selectedOption && handleRulesForEachResource(selectedResource.type)}

      {/* Agreement Modal */}
      <Modal isOpen={isAgreementModalOpen} onClose={handleAgreementCancel}>
        <div className="agreement-modal">
          <h2 className="agreement-title">{t("TablesAndChairsAgreement.Title")}</h2>
          <p className="agreement-intro">
            {t("TablesAndChairsAgreement.Intro").replace("[User's Name]", user?.name || "")}
          </p>
          <ul className="agreement-terms">
            {(t("TablesAndChairsAgreement.Terms", { returnObjects: true }) as string[]).map((term, index) => (
              <li key={index}>{term}</li>
            ))}
          </ul>
          <div className="agreement-actions">
            <button onClick={handleAgreementConfirm} className="confirm-button">
              {t("TablesAndChairsAgreement.Confirm")}
            </button>
            <button onClick={handleAgreementCancel} className="cancel-button">
              {t("TablesAndChairsAgreement.Cancel")}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default BookingSection

