import { useFetch } from "../useFetch"
import type { UserResponse } from "../../types/User"
import { getApiBaseUrl } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useUserProfile(token: string | null) {
  const fetcher = (url: string): Promise<UserResponse> =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch user profile")
      }
      return res.json()
    })

  const { data, isError, isLoading, mutate } = useFetch<UserResponse>(token ? `${API_BASE_URL}/users/profile` : null, {
    fetcher,
  })

  const fetchProfile = async (): Promise<UserResponse> => {
    const response = await mutate(() =>
      fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch user profile")
        }
        return res.json()
      }),
    )
    if (!response) {
      throw new Error("Failed to fetch user profile")
    }
    return response
  }

  return {
    data,
    error: isError,
    isLoading,
    fetchProfile,
  }
}
