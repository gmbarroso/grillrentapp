"use client"

import { useState } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface LoginResponse {
  access_token?: string
  [key: string]: any
}

export function useLoginUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Add more detailed logging to help debug
  const login = async (body: { apartment: string; block: number; password: string }): Promise<LoginResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/login"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, body)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      logApiResponse(endpoint, response.status, { headers: Object.fromEntries([...response.headers.entries()]) })

      const result = await response.json()

      if (!response.ok && response.status !== 201) {
        throw new Error(result.message || "Login failed")
      }

      setIsLoading(false)
      return result
    } catch (error) {
      console.error("Error in login:", error)
      const apiError = handleApiError(error, "/users/login")
      setError(apiError)
      setIsLoading(false)
      return null
    }
  }

  return {
    login,
    isLoading,
    error,
  }
}
