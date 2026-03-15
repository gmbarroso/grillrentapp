"use client"

import { useState, useCallback } from "react"
import { mutate as mutateSWRCache } from "swr"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"
import type { CreateNoticeDto, Notice } from "../../types/Notice"

const API_BASE_URL = getApiBaseUrl()
const UNREAD_COUNT_ENDPOINT = `${API_BASE_URL}/notices/unread-count`
const NOTICE_LIST_ENDPOINT_PREFIX = `${API_BASE_URL}/notices?`

export function useCreateNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createNotice = useCallback(async (noticeData: CreateNoticeDto): Promise<{ success: true; data: Notice } | { success: false; error: Error }> => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/notices"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, noticeData)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noticeData),
      })

      const data = (await response.json()) as Notice
      logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || `Failed to create notice: ${response.status}`)
      }

      await Promise.all([
        mutateSWRCache(UNREAD_COUNT_ENDPOINT),
        mutateSWRCache((key) => typeof key === "string" && key.startsWith(NOTICE_LIST_ENDPOINT_PREFIX)),
      ])

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in createNotice:", err)
      const apiError = handleApiError(err, "/notices")
      setError(apiError)
      setIsLoading(false)
      return { success: false, error: apiError }
    }
  }, [])

  return { createNotice, isLoading, error }
}
