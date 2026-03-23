"use client"

import { useState } from "react"
import type { BatchBookingResponse, BatchBookingSlotInput } from "../../types"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface CreateBatchBookingInput {
  resourceId: string
  slots: BatchBookingSlotInput[]
  needTablesAndChairs?: boolean
  bookedOnBehalf?: string
}

export function useCreateBatchBooking(_token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createBatchBooking = async (bookingData: CreateBatchBookingInput): Promise<BatchBookingResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/bookings/batch"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, bookingData)

      const res = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      const result = await res.json()
      logApiResponse(endpoint, res.status, result)

      if (!res.ok) {
        throw new Error(result.message || "Failed to create batch booking")
      }

      return result
    } catch (error) {
      console.error("Error in createBatchBooking:", error)
      const apiError = handleApiError(error, "/bookings/batch")
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createBatchBooking,
    isLoading,
    error,
  }
}
