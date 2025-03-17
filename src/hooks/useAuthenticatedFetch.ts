"use client"

import { useAuth } from "../context/AuthContext"
import { isTokenExpired } from "../utils/jwt"
import { useCallback, useRef } from "react"

export function useAuthenticatedFetch() {
  // Add render counter for debugging
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[useAuthenticatedFetch] Render count: ${renderCount.current}`)

  const { token, logout } = useAuth()

  // Memoize the authenticatedFetch function to prevent recreation on every render
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      console.log(`[useAuthenticatedFetch] Fetch request to: ${url}`)

      if (!token || isTokenExpired(token)) {
        console.log(`[useAuthenticatedFetch] Token invalid or expired, logging out`)
        logout()
        throw new Error("Authentication token expired")
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        console.log(`[useAuthenticatedFetch] Received 401 response, logging out`)
        logout()
        throw new Error("Authentication failed")
      }

      return response
    },
    [token, logout],
  )

  return authenticatedFetch
}

