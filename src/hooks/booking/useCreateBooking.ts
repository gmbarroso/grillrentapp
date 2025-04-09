"use client"

import { useState } from "react"
import type { Booking } from "../../types/Booking"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

interface BookingResponse {
  message: string
  booking: Booking
}

const API_BASE_URL = getApiBaseUrl()

export function useCreateBooking(token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createBooking = async (bookingData: {
    resourceId: string
    startTime: string
    endTime: string
    needTablesAndChairs?: boolean
    bookedOnBehalf?: string
  }): Promise<BookingResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/bookings"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, bookingData)

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      })

      const result = await res.json()
      logApiResponse(endpoint, res.status, result)

      if (!res.ok) {
        throw new Error(result.message || "Failed to create booking")
      }

      return result
    } catch (error) {
      console.error("Error in createBooking:", error)
      const apiError = handleApiError(error, "/bookings")
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createBooking,
    isLoading,
    error,
  }
}
