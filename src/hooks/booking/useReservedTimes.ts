"use client"

import { useState, useEffect, useRef } from "react"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

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

  // Add fetch tracking to prevent excessive fetches
  const fetchCount = useRef(0)
  const lastFetchTime = useRef(0)
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

      // Prevent excessive fetches
      const now = Date.now()
      if (now - lastFetchTime.current < 2000) {
        // 2 second throttle
        console.log(`[useReservedTimes] Throttling fetch for ${resourceType}`)
        return
      }

      // Track fetch count and time
      fetchCount.current += 1
      lastFetchTime.current = now

      // Safety check to prevent infinite loops
      if (fetchCount.current > 10) {
        console.warn(`[useReservedTimes] Too many fetches (${fetchCount.current}). Possible infinite loop.`)
        return
      }

      if (!isMounted.current) return

      setIsLoading(true)
      setError(null)

      try {
        let endpoint = `/bookings/reserved-times?resourceType=${resourceType}`
        if (resourceType === "tennis" && date) {
          const formattedDate = date.toISOString().split("T")[0]
          endpoint += `&date=${formattedDate}`
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
            const startTime = new Date(slot.startTime)
            const hour = startTime.getHours()
            const timeSlot = `${hour.toString().padStart(2, "0")}:00`
            bookedTimes.push(timeSlot)
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

    // Reset fetch count after 30 seconds
    const resetTimer = setTimeout(() => {
      fetchCount.current = 0
    }, 30000)

    return () => {
      clearTimeout(resetTimer)
    }
  }, [resourceType, date, authenticatedFetch])

  return {
    reservedTimes,
    reservedDays,
    isLoading,
    error,
  }
}
