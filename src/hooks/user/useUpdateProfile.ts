"use client"

import { useState } from "react"
import { useFetch } from "../useFetch"
import type { UserResponse } from "../../types"
import {
  extractApiErrorMessage,
  getApiBaseUrl,
  logApiRequest,
  logApiResponse,
  handleApiError,
  fetchWithAuthHandling,
} from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface UpdateUserProfileDto {
  name?: string
}

interface OnboardingEmailResponse {
  message: string
  onboarding?: {
    mustProvideEmail?: boolean
    mustVerifyEmail?: boolean
    mustChangePassword?: boolean
    onboardingRequired?: boolean
    isOnboardingComplete?: boolean
  }
  mustProvideEmail?: boolean
  mustVerifyEmail?: boolean
  mustChangePassword?: boolean
  onboardingRequired?: boolean
}

export function useUpdateProfile(token: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate } = useFetch<UserResponse>(token ? `${API_BASE_URL}/users/profile` : null)

  const updateProfile = async (updateData: UpdateUserProfileDto): Promise<UserResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/profile"
      logApiRequest("PUT", `${API_BASE_URL}${endpoint}`, updateData)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao atualizar perfil (${response.status})`)
        throw new Error(message)
      }

      const data: UserResponse = await response.json()
      logApiResponse(endpoint, response.status, data)

      await mutate(data, false)
      return data
    } catch (err) {
      const apiError = handleApiError(err, "/users/profile")
      setError(apiError.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const setOnboardingEmail = async (email: string): Promise<OnboardingEmailResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/onboarding/email"
      const payload = { email: email.trim() }
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, payload)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao atualizar e-mail (${response.status})`)
        throw new Error(message)
      }

      const data: OnboardingEmailResponse = await response.json()
      logApiResponse(endpoint, response.status, data)
      return data
    } catch (err) {
      const apiError = handleApiError(err, "/users/onboarding/email")
      setError(apiError.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const canDeleteProfile = (userRole: string): boolean => {
    return userRole === "admin"
  }

  return { updateProfile, setOnboardingEmail, isLoading, error, canDeleteProfile }
}
