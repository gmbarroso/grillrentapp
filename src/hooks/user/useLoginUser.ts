"use client"

import { useState } from "react"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

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
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
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

