"use client"

import { useState } from "react"
import {
  extractApiErrorMessage,
  fetchWithAuthHandling,
  getApiBaseUrl,
  handleApiError,
  logApiRequest,
  logApiResponse,
} from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

interface ChangePasswordResponse {
  message: string
}

export function useChangePassword() {
  const [isLoading, setIsLoading] = useState(false)

  const changePassword = async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
    setIsLoading(true)
    const endpoint = "/users/change-password"
    logApiRequest("PUT", `${API_BASE_URL}${endpoint}`, payload)

    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Não foi possível alterar a senha (${response.status})`)
        throw new Error(message)
      }

      const data = await response.json() as ChangePasswordResponse
      logApiResponse(endpoint, response.status, data)
      return data
    } catch (error) {
      throw handleApiError(error, endpoint)
    } finally {
      setIsLoading(false)
    }
  }

  return { changePassword, isLoading }
}
