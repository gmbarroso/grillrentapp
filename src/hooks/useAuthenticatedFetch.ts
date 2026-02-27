"use client"

import { useCallback } from "react"
import { handleApiError, fetchWithAuthHandling } from "../utils/api"

export function useAuthenticatedFetch() {
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      try {
        const response = await fetchWithAuthHandling(url, options)

        return response
      } catch (error) {
        // Handle CORS and network errors
        throw handleApiError(error, url)
      }
    },
    [],
  )

  return authenticatedFetch
}
