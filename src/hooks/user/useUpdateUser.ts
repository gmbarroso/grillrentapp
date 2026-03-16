import { useCallback, useState } from "react"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { User } from "../../types/User"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface UpdateUserPayload {
  name?: string
  email?: string
  apartment?: string
  block?: number
  password?: string
}

interface UpdateUserResponse {
  message: string
  user: User
}

export function useUpdateUser() {
  const authenticatedFetch = useAuthenticatedFetch()
  const [isLoading, setIsLoading] = useState(false)

  const updateUser = useCallback(
    async (userId: string, payload: UpdateUserPayload): Promise<User> => {
      const endpoint = `${API_BASE_URL}/users/${userId}`
      logApiRequest("PUT", endpoint, payload)
      setIsLoading(true)

      try {
        const response = await authenticatedFetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Failed to update user: ${response.status}`)
        }

        const data = (await response.json()) as UpdateUserResponse
        logApiResponse(endpoint, response.status, data)
        return data.user
      } catch (error) {
        throw handleApiError(error, endpoint)
      } finally {
        setIsLoading(false)
      }
    },
    [authenticatedFetch],
  )

  return {
    updateUser,
    isLoading,
  }
}
