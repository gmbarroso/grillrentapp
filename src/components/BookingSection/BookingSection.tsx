import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import Calendar from "../Calendar/Calendar"
import { LoadingSpinner } from "../"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useCreateBooking } from "../../hooks/booking/useCreateBooking"
import { useToast } from "../../context/ToastContext"
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
  const [selectedOption, setSelectedOption] = useState<"grill" | "tennis" | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(null)

  const {
    data: resources,
    isLoading: isResourcesLoading,
    error: resourcesError
  } = useAllResources(token)
  const {
    createBooking,
    isLoading: isCreatingBooking,
    error: createBookingError
  } = useCreateBooking(token)

  const selectedResource = selectedOption ? resources?.find((r: Resource) => r.type === selectedOption) : null

  const handleOptionSelect = (option: "grill" | "tennis") => {
    setSelectedOption(option)
    setSelectedDate(null)
    setIsDateAvailable(null)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setIsDateAvailable(null)
  }

  const handleConfirmDate = async () => {
    if (selectedResource && selectedDate) {
      const startTime = new Date(selectedDate)
      startTime.setHours(10, 0, 0, 0)
      const endTime = new Date(selectedDate)
      endTime.setHours(22, 0, 0, 0)

      try {
        const bookingData = {
          resourceId: selectedResource.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }
        await createBooking(bookingData)
        setIsDateAvailable(true)
        onBookingCreated()
        showToast(t("BookingCreatedSuccess"), "success")
      } catch (error) {
        console.error("Error creating booking:", error)
        setIsDateAvailable(false)
        onBookingError(t("ErrorCreatingBooking"))
        showToast(t("ErrorCreatingBooking"), "error")
      }
    }
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
          {selectedDate && (
            <div>
              <button onClick={handleConfirmDate} disabled={isCreatingBooking} className="confirm-date-button">
                {t("ConfirmDate")}
              </button>
              {isCreatingBooking && <LoadingSpinner />}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default BookingSection

