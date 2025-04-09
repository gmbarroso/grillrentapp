"use client"

import { useState, useCallback } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useUpdateNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateNotice = useCallback(
    async (noticeId: string, updateData: { title?: string; subtitle?: string; content?: string }) => {
      setIsLoading(true)
      setError(null)

      try {
        const endpoint = `/notices/${noticeId}`
        logApiRequest("PUT", `${API_BASE_URL}${endpoint}`, updateData)

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        })

        const data = await response.json()
        logApiResponse(endpoint, response.status, data)

        if (!response.ok) {
          throw new Error(data.message || `Failed to update notice: ${response.status}`)
        }

        setIsLoading(false)
        return { success: true, data }
      } catch (err) {
        console.error("Error in updateNotice:", err)
        const apiError = handleApiError(err, `/notices/${noticeId}`)
        setError(apiError)
        setIsLoading(false)
        return { success: false, error: apiError }
      }
    },
    [],
  )

  return { updateNotice, isLoading, error }
}
