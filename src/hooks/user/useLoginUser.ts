"use client"

import { useState } from "react"
import { fetchWithAuthHandling, getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"
import { authError } from "../../utils/auth-logger"

const API_BASE_URL = getApiBaseUrl()

interface LoginResponse {
  access_token?: string
  [key: string]: any
}

type LoginApiError = Error & { status?: number; code?: string }

const resolveLoginErrorCode = (status: number, message: string): string | undefined => {
  if ((status === 400 || status === 401) && /invalid condominium code/i.test(message)) {
    return "INVALID_CONDOMINIUM_CODE"
  }
  return undefined
}

export function useLoginUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const login = async (body: {
    organizationSlug: string
    apartment: string
    block: number
    password: string
  }): Promise<LoginResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/login"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, body)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      logApiResponse(endpoint, response.status, { headers: Object.fromEntries([...response.headers.entries()]) })

      const result = await response.json()

      if (!response.ok && response.status !== 201) {
        const message = result.message || "Login failed"
        const loginError = new Error(message) as LoginApiError
        loginError.status = response.status
        loginError.code = resolveLoginErrorCode(response.status, message)
        throw loginError
      }

      setIsLoading(false)
      return result
    } catch (error) {
      authError("[Auth] Error in login:", error)
      const apiError = error instanceof Error && ("status" in error || "code" in error)
        ? error
        : handleApiError(error, "/users/login")
      setError(apiError)
      setIsLoading(false)
      throw apiError
    }
  }

  return {
    login,
    isLoading,
    error,
  }
}
