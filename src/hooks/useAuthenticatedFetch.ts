"use client"

import { useAuth } from "../context/AuthContext"
import { isTokenExpired } from "../utils/jwt"

export function useAuthenticatedFetch() {
  const { token, logout } = useAuth()

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!token || isTokenExpired(token)) {
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
      logout()
      throw new Error("Authentication failed")
    }

    return response
  }

  return authenticatedFetch
}

