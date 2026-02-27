import { useFetch } from "../useFetch"
import type { UserResponse } from "../../types/User"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useUserProfile(token?: string | null) {
  const fetcher = (url: string): Promise<UserResponse> => {
    logApiRequest("GET", url)
    return fetchWithAuthHandling(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch user profile")
        }
        const data = res.json()
        logApiResponse(url, res.status)
        return data
      })
      .catch((err) => {
        const apiError = handleApiError(err, url)
        throw apiError
      })
  }

  const { data, isError, isLoading, mutate } = useFetch<UserResponse>(token ? `${API_BASE_URL}/users/profile` : null, {
    fetcher,
  })

  const fetchProfile = async (): Promise<UserResponse> => {
    try {
      const endpoint = "/users/profile"
      logApiRequest("GET", `${API_BASE_URL}${endpoint}`)

      const response = await mutate(() =>
        fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`)
          .then((res) => {
            logApiResponse(endpoint, res.status)
            if (!res.ok) {
              throw new Error("Failed to fetch user profile")
            }
            return res.json()
          })
          .catch((err) => {
            throw handleApiError(err, endpoint)
          }),
      )
      if (!response) {
        throw new Error("Failed to fetch user profile")
      }
      return response
    } catch (err) {
      throw handleApiError(err, "/users/profile")
    }
  }

  return {
    data,
    error: isError,
    isLoading,
    fetchProfile,
  }
}
