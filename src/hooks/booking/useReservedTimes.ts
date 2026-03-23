"use client"

import { useState, useEffect, useRef } from "react"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"
import { formatBookingDateKey, formatBookingHourSlot } from "../../utils/booking-datetime"

const API_BASE_URL = getApiBaseUrl()

interface ReservedTimesResponse {
  reservedTimes?: {
    startTime: string
    endTime: string
    userId?: string | null
    userApartment?: string | null
    userBlock?: number | string | null
    bookedOnBehalf?: string | null
  }[]
  reservedDays?: string[]
  reservedDayDetails?: Record<string, ReservedSlotInfo>
}

export interface ReservedSlotInfo {
  userId?: string | null
  userApartment?: string | null
  userBlock?: number | string | null
  bookedOnBehalf?: string | null
}

export function useReservedTimes(resourceType: "hourly" | "daily" | undefined, date?: Date) {
  const [reservedTimes, setReservedTimes] = useState<string[]>([])
  const [reservedTimeDetails, setReservedTimeDetails] = useState<Record<string, ReservedSlotInfo>>({})
  const [reservedDays, setReservedDays] = useState<string[]>([])
  const [reservedDayDetails, setReservedDayDetails] = useState<Record<string, ReservedSlotInfo>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const authenticatedFetch = useAuthenticatedFetch()
  const dateKey = date ? formatBookingDateKey(date) : undefined

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const fetchReservedTimes = async () => {
      // Hourly resources require a specific date.
      if (!resourceType || (resourceType === "hourly" && !date)) {
        setReservedTimes([])
        setReservedTimeDetails({})
        setReservedDays([])
        setReservedDayDetails({})
        return
      }

      if (!isMounted.current) return

      setIsLoading(true)
      setError(null)

      try {
        let endpoint = `/bookings/reserved-times?resourceType=${resourceType}`
        if (resourceType === "hourly" && dateKey) {
          endpoint += `&date=${dateKey}`
        }

        logApiRequest("GET", `${API_BASE_URL}${endpoint}`)

        const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`)

        if (!isMounted.current) return

        if (!response.ok) {
          throw new Error("Failed to fetch reserved times")
        }

        const data: ReservedTimesResponse = await response.json()
        logApiResponse(endpoint, response.status, data)

        if (!isMounted.current) return

        if (resourceType === "hourly" && data.reservedTimes) {
          const bookedTimes: string[] = []
          const bookedTimeDetails: Record<string, ReservedSlotInfo> = {}

          data.reservedTimes.forEach((slot) => {
            const slotKey = formatBookingHourSlot(slot.startTime)
            bookedTimes.push(slotKey)
            bookedTimeDetails[slotKey] = {
              userId: slot.userId ?? null,
              userApartment: slot.userApartment ?? null,
              userBlock: slot.userBlock ?? null,
              bookedOnBehalf: slot.bookedOnBehalf ?? null,
            }
          })

          setReservedTimes(bookedTimes)
          setReservedTimeDetails(bookedTimeDetails)
        } else if (resourceType === "daily" && data.reservedDays) {
          setReservedDays(data.reservedDays)
          setReservedDayDetails(data.reservedDayDetails ?? {})
        }
      } catch (err) {
        console.error("Error fetching reserved times:", err)
        if (isMounted.current) {
          const apiError = handleApiError(err, `/bookings/reserved-times?resourceType=${resourceType}`)
          setError(apiError)
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchReservedTimes()
  }, [resourceType, dateKey, authenticatedFetch])

  return {
    reservedTimes,
    reservedTimeDetails,
    reservedDays,
    reservedDayDetails,
    isLoading,
    error,
  }
}
