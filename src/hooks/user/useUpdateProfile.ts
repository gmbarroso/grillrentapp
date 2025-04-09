"use client"

import { useState } from "react"
import { useFetch } from "../useFetch"
import type { User, UserResponse } from "../../types/User"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface UpdateUserProfileDto {
  name?: string
  email?: string
  password?: string
}

export function useUpdateProfile(token: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate } = useFetch<UserResponse>(token ? `${API_BASE_URL}/users/profile` : null)

  const updateProfile = async (updateData: UpdateUserProfileDto): Promise<User | null> => {
    if (!token) return null

    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/users/profile"
      logApiRequest("PUT", `${API_BASE_URL}${endpoint}`, updateData)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data: UserResponse = await response.json()
      logApiResponse(endpoint, response.status, data)

      await mutate(data, false)
      return data.user
    } catch (err) {
      const apiError = handleApiError(err, "/users/profile")
      setError(apiError.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const canDeleteProfile = (userRole: string): boolean => {
    return userRole === "admin"
  }

  return { updateProfile, isLoading, error, canDeleteProfile }
}
