import { useFetch } from "../useFetch"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useAllResources(token: string) {
  const fetcher = (url: string) => {
    logApiRequest("GET", url)
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch resources")
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

  const { data, isError, isLoading, mutate } = useFetch(`${API_BASE_URL}/resources`, { fetcher })

  const fetchResources = async () => {
    try {
      const endpoint = "/resources"
      logApiRequest("GET", `${API_BASE_URL}${endpoint}`)

      const response = await mutate(() =>
        fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            logApiResponse(endpoint, res.status)
            if (!res.ok) {
              throw new Error("Failed to fetch resources")
            }
            return res.json()
          })
          .catch((err) => {
            throw handleApiError(err, endpoint)
          }),
      )
      return response
    } catch (err) {
      throw handleApiError(err, "/resources")
    }
  }

  return {
    data,
    error: isError,
    isLoading,
    fetchResources,
  }
}
