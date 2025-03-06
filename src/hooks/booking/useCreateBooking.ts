import { useState } from "react"
import type { Booking } from "../../types/Booking"

interface BookingResponse {
  message: string
  booking: Booking
}

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useCreateBooking(token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createBooking = async (bookingData: {
    resourceId: string
    startTime: string
    endTime: string
  }): Promise<BookingResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to create booking")
      }

      const response: BookingResponse = await res.json()
      return response
    } catch (error) {
      console.error("Error in createBooking:", error)
      setError(error instanceof Error ? error : new Error("An unknown error occurred"))
      throw error
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

