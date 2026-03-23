import { useCallback } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { User } from "../../types"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface UsersListResponse {
  users?: User[]
  data?: User[]
}

export function useAllUsers() {
  const authenticatedFetch = useAuthenticatedFetch()
  const endpoint = `${API_BASE_URL}/users`

  const fetcher = useCallback(
    async (url: string): Promise<User[]> => {
      logApiRequest("GET", url)
      try {
        const response = await authenticatedFetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load users: ${response.status}`)
        }

        const payload = (await response.json()) as UsersListResponse | User[]
        const users = Array.isArray(payload) ? payload : payload.users || payload.data || []
        logApiResponse(url, response.status, { total: users.length })
        return users
      } catch (error) {
        throw handleApiError(error, url)
      }
    },
    [authenticatedFetch],
  )

  const { data, isLoading, isError, mutate } = useFetch<User[]>(endpoint, {
    fetcher,
    revalidateOnFocus: true,
  })

  return {
    users: data || [],
    isLoading,
    isError,
    refreshUsers: mutate,
  }
}
