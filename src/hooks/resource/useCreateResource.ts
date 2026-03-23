"use client"

import { useState } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface CreateResourcePayload {
  name: string
  type: "hourly" | "daily"
  description?: string
}

interface CreateResourceResponse {
  message: string
}

export function useCreateResource(_token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createResource = async (payload: CreateResourcePayload): Promise<CreateResourceResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/resources"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, payload)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create resource")
      }

      return data
    } catch (err) {
      const apiError = handleApiError(err, "/resources")
      setError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createResource,
    isLoading,
    error,
  }
}
