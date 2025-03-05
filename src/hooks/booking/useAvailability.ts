import { useFetch } from "../useFetch"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export function useAvailability(resourceId: string, startTime: string, endTime: string, token: string) {
  const fetcher = (url: string) => fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error("Failed to fetch availability")
    }
    return res.json()
  })

  const { data, isError, isLoading, mutate } = useFetch(null, { fetcher })

  const checkAvailability = async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/availability/${resourceId}?startTime=${startTime}&endTime=${endTime}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const result = await response.json()
    return result
  }

  return {
    data,
    error: isError,
    isLoading,
    checkAvailability,
  }
}
