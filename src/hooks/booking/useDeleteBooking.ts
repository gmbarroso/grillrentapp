"use client"

import { useState, useCallback } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useDeleteBooking(token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteBooking = useCallback(
    async (bookingId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const endpoint = `/bookings/${bookingId}`
        logApiRequest("DELETE", `${API_BASE_URL}${endpoint}`)

        const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()
        logApiResponse(endpoint, response.status, data)

        if (!response.ok) {
          throw new Error(data.message || `Failed to delete booking: ${response.status}`)
        }

        setIsLoading(false)
        return { success: true, data }
      } catch (err) {
        console.error("Error in deleteBooking:", err)
        const apiError = handleApiError(err, `/bookings/${bookingId}`)
        setError(apiError)
        setIsLoading(false)
        return { success: false, error: apiError }
      }
    },
    [token],
  )

  return { deleteBooking, isLoading, error }
}
