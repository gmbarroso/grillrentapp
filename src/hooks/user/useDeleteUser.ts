import { useCallback, useState } from "react"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface DeleteUserResponse {
  message: string
}

export function useDeleteUser() {
  const authenticatedFetch = useAuthenticatedFetch()
  const [isLoading, setIsLoading] = useState(false)

  const deleteUser = useCallback(
    async (userId: string): Promise<DeleteUserResponse> => {
      const endpoint = `${API_BASE_URL}/users/${userId}`
      logApiRequest("DELETE", endpoint)
      setIsLoading(true)

      try {
        const response = await authenticatedFetch(endpoint, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error(`Failed to delete user: ${response.status}`)
        }

        const data = (await response.json()) as DeleteUserResponse
        logApiResponse(endpoint, response.status, data)
        return data
      } catch (error) {
        throw handleApiError(error, endpoint)
      } finally {
        setIsLoading(false)
      }
    },
    [authenticatedFetch],
  )

  return {
    deleteUser,
    isLoading,
  }
}
