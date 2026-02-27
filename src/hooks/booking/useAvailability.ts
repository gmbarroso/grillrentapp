"use client"

import { useState, useCallback } from "react"
import { useFetch } from "../useFetch"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useAvailability(resourceId: string, startTime: string, endTime: string, token: string) {
  const [error, setError] = useState<Error | null>(null)

  const fetcher = useCallback(
    (url: string) => {
      logApiRequest("GET", url)
      return fetchWithAuthHandling(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch availability")
          }
          const data = res.json()
          logApiResponse(url, res.status)
          return data
        })
        .catch((err) => {
          const apiError = handleApiError(err, url)
          setError(apiError)
          throw apiError
        })
    },
    [token],
  )

  const { data, isError, isLoading, mutate } = useFetch(null, { fetcher })

  const checkAvailability = async () => {
    try {
      const endpoint = `/bookings/availability/${resourceId}?startTime=${startTime}&endTime=${endTime}`
      logApiRequest("GET", `${API_BASE_URL}${endpoint}`)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()
      logApiResponse(endpoint, response.status, result)

      return result
    } catch (err) {
      const apiError = handleApiError(err, `/bookings/availability/${resourceId}`)
      setError(apiError)
      throw apiError
    }
  }

  return {
    data,
    error: error || isError,
    isLoading,
    checkAvailability,
  }
}
