"use client"

import { useState, useEffect, useRef } from "react"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"
import { formatBookingDateKey, formatBookingHourSlot } from "../../utils/booking-datetime"

const API_BASE_URL = getApiBaseUrl()

interface ReservedTimesResponse {
  reservedTimes?: { startTime: string; endTime: string }[]
  reservedDays?: string[]
}

export function useReservedTimes(resourceType: "tennis" | "grill" | undefined, date?: Date) {
  const [reservedTimes, setReservedTimes] = useState<string[]>([])
  const [reservedDays, setReservedDays] = useState<string[]>([])
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
      // For tennis, only fetch if both resourceType and date are provided
      if (!resourceType || (resourceType === "tennis" && !date)) {
        setReservedTimes([])
        setReservedDays([])
        return
      }

      if (!isMounted.current) return

      setIsLoading(true)
      setError(null)

      try {
        let endpoint = `/bookings/reserved-times?resourceType=${resourceType}`
        if (resourceType === "tennis" && dateKey) {
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

        if (resourceType === "tennis" && data.reservedTimes) {
          const bookedTimes: string[] = []

          data.reservedTimes.forEach((slot) => {
            bookedTimes.push(formatBookingHourSlot(slot.startTime))
          })

          setReservedTimes(bookedTimes)
        } else if (resourceType === "grill" && data.reservedDays) {
          setReservedDays(data.reservedDays)
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
    reservedDays,
    isLoading,
    error,
  }
}
