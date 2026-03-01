"use client"

import { useState } from "react"
import { fetchWithAuthHandling, getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"
import { authError } from "../../utils/auth-logger"

const API_BASE_URL = getApiBaseUrl()

interface RegisterRequestBody {
  organizationSlug: string
  name: string
  email: string
  password: string
  apartment: string
  block: number
}

interface RegisterResponse {
  message: string
  user?: {
    id?: string
  }
}

type RegisterApiError = Error & { status?: number; code?: string }

const resolveRegisterErrorCode = (status: number, message: string): string | undefined => {
  if ((status === 400 || status === 401) && /invalid condominium code/i.test(message)) {
    return "INVALID_CONDOMINIUM_CODE"
  }
  return undefined
}

export function useRegisterUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const register = async (body: RegisterRequestBody): Promise<RegisterResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/register"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, body)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      logApiResponse(endpoint, response.status, { headers: Object.fromEntries([...response.headers.entries()]) })

      const result = await response.json() as RegisterResponse & { message?: string }
      if (!response.ok) {
        const message = result.message || "Registration failed"
        const registerError = new Error(message) as RegisterApiError
        registerError.status = response.status
        registerError.code = resolveRegisterErrorCode(response.status, message)
        throw registerError
      }

      setIsLoading(false)
      return result
    } catch (error) {
      authError("[Auth] Error in register:", error)
      const apiError = error instanceof Error && ("status" in error || "code" in error)
        ? error
        : handleApiError(error, "/users/register")
      setError(apiError)
      setIsLoading(false)
      throw apiError
    }
  }

  return {
    register,
    isLoading,
    error,
  }
}
