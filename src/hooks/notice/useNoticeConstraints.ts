"use client"

import { useCallback } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()
const NOTICE_CONSTRAINTS_ENDPOINT = `${API_BASE_URL}/notices/constraints`
const DEFAULT_NOTICE_CONTENT_MAX_LENGTH = 10000

interface NoticeConstraintsResponse {
  contentMaxLength?: number
}

export function useNoticeConstraints() {
  const authenticatedFetch = useAuthenticatedFetch()

  const fetcher = useCallback(
    async (url: string): Promise<NoticeConstraintsResponse> => {
      logApiRequest("GET", url)
      try {
        const response = await authenticatedFetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load notice constraints: ${response.status}`)
        }
        const data = (await response.json()) as NoticeConstraintsResponse
        logApiResponse(url, response.status, data)
        return data
      } catch (error) {
        throw handleApiError(error, url)
      }
    },
    [authenticatedFetch],
  )

  const { data, isLoading, isError } = useFetch<NoticeConstraintsResponse>(NOTICE_CONSTRAINTS_ENDPOINT, { fetcher })
  const resolvedContentMaxLength = data?.contentMaxLength

  const sanitizedContentMaxLength =
    typeof resolvedContentMaxLength === "number" && Number.isFinite(resolvedContentMaxLength)
      ? Math.max(1, Math.floor(resolvedContentMaxLength))
      : DEFAULT_NOTICE_CONTENT_MAX_LENGTH

  return {
    contentMaxLength: sanitizedContentMaxLength,
    isLoading,
    isError: Boolean(isError),
  }
}
