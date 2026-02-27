"use client"

import { useState, useCallback } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useLogoutUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const logout = useCallback(async (token: string) => {
    if (!token) return { success: true }

    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/logout"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || `Failed to logout: ${response.status}`)
      }

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in logout:", err)
      const apiError = handleApiError(err, "/users/logout")
      setError(apiError)
      setIsLoading(false)
      return { success: true, error: apiError }
    }
  }, [])

  return { logout, isLoading, error }
}
