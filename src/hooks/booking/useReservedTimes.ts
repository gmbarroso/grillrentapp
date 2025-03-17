"use client"

import { useState, useEffect } from "react"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

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

  useEffect(() => {
    // Update the fetchReservedTimes function to handle the case where date is required for tennis

    const fetchReservedTimes = async () => {
      // For tennis, only fetch if both resourceType and date are provided
      if (!resourceType || (resourceType === "tennis" && !date)) {
        setReservedTimes([])
        setReservedDays([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        let url = `${API_BASE_URL}/bookings/reserved-times?resourceType=${resourceType}`

        // Add date parameter for tennis courts
        if (resourceType === "tennis" && date) {
          const formattedDate = date.toISOString().split("T")[0]
          url += `&date=${formattedDate}`
        }

        const response = await authenticatedFetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch reserved times")
        }

        const data: ReservedTimesResponse = await response.json()

        if (resourceType === "tennis" && data.reservedTimes) {
          // Process the reserved times for tennis
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
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservedTimes()
  }, [resourceType, date, authenticatedFetch])

  return {
    reservedTimes,
    reservedDays,
    isLoading,
    error,
  }
}

