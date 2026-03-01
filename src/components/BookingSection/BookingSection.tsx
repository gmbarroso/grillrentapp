"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useCreateBooking } from "../../hooks/booking/useCreateBooking"
import { useReservedTimes } from "../../hooks/booking/useReservedTimes"
import { useToast } from "../../context/ToastContext"
import { useAuth } from "../../context/AuthContext"
import type { Resource } from "../../types/Resource"
import type { BookingSectionProps } from "../../types/Booking"
import { LoadingSpinner, Modal, CustomCalendar, TimeSlotSelector, Tooltip, Button } from "../"
import "./BookingSection.css"

interface ExtendedBookingSectionProps extends BookingSectionProps {
  onBookingCreated: () => void
  onBookingError: (errorMessage: string) => void
}

const BookingSection: React.FC<ExtendedBookingSectionProps> = ({
  token,
  onBookingCreated,
  onBookingError,
}) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [selectedOption, setSelectedOption] = useState<"grill" | "tennis" | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const {
    reservedTimes: unavailableTimes,
    reservedDays,
    isLoading: isLoadingTimes,
    error: timesError,
  } = useReservedTimes(selectedOption as "tennis" | "grill" | undefined, selectedDate || undefined)
  const [needTablesAndChairs, setNeedTablesAndChairs] = useState(false)
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false)
  const [calendarKey, setCalendarKey] = useState<string>(`${selectedOption}-${Date.now()}`)
  const [isFetchingAfterDateSelect, setIsFetchingAfterDateSelect] = useState(false)
  const [bookedOnBehalf, setBookedOnBehalf] = useState<string>("")

  const { data: resources, isLoading: isResourcesLoading, error: resourcesError } = useAllResources(token)
  const { createBooking, isLoading: isCreatingBooking } = useCreateBooking(token)

  const selectedResource = useMemo(() => {
    return selectedOption ? resources?.find((r: Resource) => r.type === selectedOption) : null
  }, [selectedOption, resources])

  useEffect(() => {
    if (selectedOption) {
      setCalendarKey(`${selectedOption}-${Date.now()}`)
    }
  }, [selectedOption])

  useEffect(() => {
    if (!isLoadingTimes && isFetchingAfterDateSelect) {
      setIsFetchingAfterDateSelect(false)
    }
  }, [isLoadingTimes, isFetchingAfterDateSelect])

  const handleOptionSelect = useCallback(
    (option: "grill" | "tennis") => {
      if (option === selectedOption) return

      setSelectedOption(option)
      setSelectedDate(null)
      setSelectedTime(null)
      setNeedTablesAndChairs(false)
    },
    [selectedOption],
  )

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)

    if (selectedOption === "grill") {
      setIsFetchingAfterDateSelect(true)
    }
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
          ...(bookedOnBehalf ? { bookedOnBehalf } : {}),
        }
        await createBooking(bookingData)
        onBookingCreated()
        showToast(t("BookingCreatedSuccess"), "success")
        setSelectedDate(null)
        setSelectedTime(null)
        setNeedTablesAndChairs(false)
        setSelectedOption(null)
        setBookedOnBehalf("")
      } catch (error) {
        console.error("Error creating booking:", error)
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
            <li key={index}>{item}</li>
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

  if (timesError && !(selectedOption === "tennis" && !selectedDate)) {
    showToast(t("ErrorFetchingSlots"), "error")
  }

  return (
    <section className="booking-section">
      <h2>{t("ChooseRent")}</h2>
      <div className="options">
        {isResourcesLoading ? (
          <div className="options-loading">
            <LoadingSpinner inline />
          </div>
        ) : resources ? (
          resources.map((resource: Resource) => (
            <Button
              key={resource.id}
              variant="secondary"
              className={selectedOption === resource.type ? "selected" : ""}
              onClick={() => handleOptionSelect(resource.type)}
            >
              {t(`Resource.${resource.type}`)}
            </Button>
          ))
        ) : null}
      </div>
      {selectedOption && (
        <div className="calendar-section">
          <div className="calendar-container">
            {selectedOption === "grill" && (isLoadingTimes || isFetchingAfterDateSelect) ? (
              <div className="calendar-loading">
                <LoadingSpinner inline />
              </div>
            ) : (
              <CustomCalendar
                key={calendarKey}
                reservedDays={selectedOption === "grill" ? reservedDays : []}
                onDateSelect={handleDateSelect}
                resourceType={selectedOption}
                selectedDate={selectedDate}
              />
            )}
          </div>

          {selectedDate && selectedOption === "grill" && !isLoadingTimes && !isFetchingAfterDateSelect && (
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
              <p>{t("GrillRentWarning")}</p>
            </div>
          )}

          {selectedDate && selectedOption === "tennis" && (
            <TimeSlotSelector
              selectedTime={selectedTime}
              onTimeSelect={handleTimeSelect}
              resourceType={selectedOption}
              selectedDate={selectedDate}
              unavailableSlots={unavailableTimes}
              isLoading={isLoadingTimes}
            />
          )}

          {selectedDate && user?.role === "admin" && (
            <div className="admin-booking-field">
              <label htmlFor="bookedOnBehalf" className="admin-booking-label">
                {t("BookOnBehalf")}
                <Tooltip content={t("BookOnBehalfTooltip")} />
              </label>
              <input
                id="bookedOnBehalf"
                type="text"
                value={bookedOnBehalf}
                onChange={(e) => setBookedOnBehalf(e.target.value)}
                maxLength={25}
                className="admin-booking-input"
                placeholder={t("BookOnBehalfPlaceholder")}
              />
            </div>
          )}

          {selectedDate && canConfirmBooking() && (
            <Button
              variant="primary"
              onClick={handleConfirmDate}
              disabled={isCreatingBooking}
              className="confirm-date-button"
            >
              {t("ConfirmDate")}
            </Button>
          )}

          {isCreatingBooking && <LoadingSpinner />}
        </div>
      )}
      {selectedOption && handleRulesForEachResource(selectedResource.type)}

      {/* I will separate all the Modals in this format in its own components in the future */}
      <Modal isOpen={isAgreementModalOpen} onClose={handleAgreementCancel} wide={true}>
        <div className="agreement-modal">
          <h2 className="agreement-title">{t("TablesAndChairsAgreement.Title")}</h2>
          <p className="agreement-content">
            {t("TablesAndChairsAgreement.Content")
              .replace("[userName]", user?.name || "")
              .replace("[userApartment]", `${user?.apartment || ""} - Bloco ${user?.block || ""}`)}
          </p>

          {(t("TablesAndChairsAgreement.Sections", { returnObjects: true }) as any[]).map((section, index) => (
            <div className="agreement-section" key={index}>
              <div className="agreement-section-title">{section.title}</div>
              <div className="agreement-section-content">{section.content}</div>
            </div>
          ))}

          <div className="agreement-date">
            {t("TablesAndChairsAgreement.DatePrefix")} {formatDateInPortuguese()}
          </div>

          <div className="agreement-signatures">
            <div className="agreement-signature">
              <div className="agreement-signature-line"></div>
              <div className="agreement-signature-name">{user?.name || ""}</div>
              <div className="agreement-signature-title">{t("TablesAndChairsAgreement.SignatureUser")}</div>
            </div>

            <div className="agreement-signature">
              <div className="agreement-signature-line"></div>
              <div className="agreement-signature-name">{t("TablesAndChairsAgreement.SignatureAdmin")}</div>
              <div className="agreement-signature-title">{t("TablesAndChairsAgreement.SignatureAdminTitle")}</div>
            </div>
          </div>

          <div className="agreement-actions">
            <Button variant="primary" onClick={handleAgreementConfirm} className="confirm-button">
              {t("TablesAndChairsAgreement.Confirm")}
            </Button>
            <Button variant="danger" onClick={handleAgreementCancel} className="cancel-button">
              {t("TablesAndChairsAgreement.Cancel")}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// I will isolate this in a separate function to avoid cluttering the main component
const formatDateInPortuguese = () => {
  const now = new Date()
  const day = now.getDate()
  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]
  const month = monthNames[now.getMonth()]
  const year = now.getFullYear()

  return `${day} de ${month} de ${year}`
}

export default BookingSection
