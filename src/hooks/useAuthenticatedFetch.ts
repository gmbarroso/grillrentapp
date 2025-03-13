"use client"

import { useAuth } from "../context/AuthContext"
import { isTokenExpired, isValidToken } from "../utils/jwt"

/**
 * A hook that provides an authenticated fetch function
 * that checks token expiration before making requests
 */
export function useAuthenticatedFetch() {
  const { token, logout } = useAuth()

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    // Check if token exists and is valid
    if (!token || !isValidToken(token)) {
      logout()
      throw new Error("Invalid authentication token")
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      logout()
      throw new Error("Authentication token expired")
    }

    // Add authorization header
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      logout()
      throw new Error("Authentication failed")
    }

    return response
  }

  return authenticatedFetch
}

