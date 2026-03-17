"use client"

import { useState } from "react"
import { fetchWithAuthHandling, getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface ForgotPasswordRequestPayload {
  organizationSlug: string
  email: string
}

interface ForgotPasswordConfirmPayload {
  organizationSlug: string
  token: string
  newPassword: string
}

interface ForgotPasswordRequestResponse {
  message: string
  resetTokenPreview?: string
}

interface ForgotPasswordConfirmResponse {
  message: string
}

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)

  const requestReset = async (payload: ForgotPasswordRequestPayload): Promise<ForgotPasswordRequestResponse> => {
    setIsLoading(true)
    const endpoint = "/users/forgot-password/request"
    logApiRequest("POST", `${API_BASE_URL}${endpoint}`, payload)
    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Failed to request reset (${response.status})`)
      }
      const data = await response.json() as ForgotPasswordRequestResponse
      logApiResponse(endpoint, response.status, data)
      return data
    } catch (error) {
      throw handleApiError(error, endpoint)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmReset = async (payload: ForgotPasswordConfirmPayload): Promise<ForgotPasswordConfirmResponse> => {
    setIsLoading(true)
    const endpoint = "/users/forgot-password/confirm"
    logApiRequest("POST", `${API_BASE_URL}${endpoint}`, { ...payload, token: "[REDACTED]" })
    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Failed to confirm reset (${response.status})`)
      }
      const data = await response.json() as ForgotPasswordConfirmResponse
      logApiResponse(endpoint, response.status, data)
      return data
    } catch (error) {
      throw handleApiError(error, endpoint)
    } finally {
      setIsLoading(false)
    }
  }

  return { requestReset, confirmReset, isLoading }
}
