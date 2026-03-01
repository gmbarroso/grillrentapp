"use client"

import { useState } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"
import { authError } from "../../utils/auth-logger"

const API_BASE_URL = getApiBaseUrl()

interface RegisterResponse {
  [key: string]: any
}

export function useRegisterUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const register = async (body: {
    organizationSlug: string
    name: string
    email: string
    password: string
    apartment: string
    block: number
  }): Promise<RegisterResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/register"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, body)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      logApiResponse(endpoint, response.status, { headers: Object.fromEntries([...response.headers.entries()]) })

      const result = await response.json()
      if (!response.ok && response.status !== 201) {
        throw new Error(result.message || "Registration failed")
      }

      setIsLoading(false)
      return result
    } catch (error) {
      authError("[Auth] Error in register:", error)
      const apiError = handleApiError(error, "/users/register")
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
