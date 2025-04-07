"use client"

import { useState } from "react"

const getApiBaseUrl = () => {
  const isStaging =
    process.env.REACT_APP_ENVIRONMENT === "staging" ||
    window.location.hostname.includes("stg") ||
    window.location.hostname.includes("staging")

  if (isStaging) {
    return process.env.REACT_APP_BFF_URL_STAGING || "https://grillrentbffv2-staging.up.railway.app"
  }

  return process.env.REACT_APP_BFF_URL || "https://grillrentbff.up.railway.app"
}

const API_BASE_URL = getApiBaseUrl()

interface LoginResponse {
  access_token?: string
  token?: string
  [key: string]: any
}

export function useLoginUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const login = async (body: { apartment: string; block: number; password: string }): Promise<LoginResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Sending login request to: ${API_BASE_URL}/users/login`)

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      })

      console.log("Login response status:", response.status)

      const result = await response.json()
      console.log("Login response data:", result)

      if (!response.ok && response.status !== 201) {
        throw new Error(result.message || "Login failed")
      }

      setIsLoading(false)
      return result
    } catch (error) {
      console.error("Error in login:", error)
      setError(error instanceof Error ? error : new Error("An unknown error occurred"))
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

