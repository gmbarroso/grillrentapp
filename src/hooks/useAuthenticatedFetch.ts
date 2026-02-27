"use client"

import { useAuth } from "../context/AuthContext"
import { isTokenExpired } from "../utils/jwt"
import { useCallback } from "react"
import { handleApiError, fetchWithAuthHandling, signalUnauthorizedOnce } from "../utils/api"

export function useAuthenticatedFetch() {
  const { token } = useAuth()

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!token || isTokenExpired(token)) {
        signalUnauthorizedOnce(url)
        throw new Error("Authentication token expired")
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      }

      try {
        const response = await fetchWithAuthHandling(url, {
          ...options,
          headers,
        })

        return response
      } catch (error) {
        // Handle CORS and network errors
        throw handleApiError(error, url)
      }
    },
    [token],
  )

  return authenticatedFetch
}
