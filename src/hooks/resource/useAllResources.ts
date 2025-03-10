import { useFetch } from "../useFetch"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useAllResources(token: string) {
  const fetcher = (url: string) => fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error("Failed to fetch resources")
    }
    return res.json()
  })

  const { data, isError, isLoading, mutate } = useFetch(
    `${API_BASE_URL}/resources`,
    { fetcher }
  )

  const fetchResources = async () => {
    const response = await mutate(() => fetch(`${API_BASE_URL}/resources`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }))
    return response
  }

  return {
    data,
    error: isError,
    isLoading,
    fetchResources,
  }
}
