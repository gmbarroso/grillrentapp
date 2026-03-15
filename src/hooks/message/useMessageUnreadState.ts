"use client"

import { useCallback } from "react"
import { mutate as mutateSWRCache } from "swr"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()
const MESSAGE_UNREAD_ENDPOINT = `${API_BASE_URL}/messages/unread-count`

interface MessageUnreadStateResponse {
  unreadCount: number
  hasUnread: boolean
}

export function useMessageUnreadState(enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch()

  const fetcher = useCallback(
    async (url: string): Promise<MessageUnreadStateResponse> => {
      logApiRequest("GET", url)
      try {
        const response = await authenticatedFetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch message unread count: ${response.status}`)
        }

        const data = (await response.json()) as MessageUnreadStateResponse
        logApiResponse(url, response.status, data)
        return data
      } catch (error) {
        throw handleApiError(error, url)
      }
    },
    [authenticatedFetch],
  )

  const { data, isError, isLoading, mutate } = useFetch<MessageUnreadStateResponse>(
    enabled ? MESSAGE_UNREAD_ENDPOINT : null,
    {
      fetcher,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  )

  const refreshUnreadState = useCallback(() => mutate(), [mutate])

  const resetUnreadState = useCallback(async () => {
    await mutateSWRCache(
      MESSAGE_UNREAD_ENDPOINT,
      {
        unreadCount: 0,
        hasUnread: false,
      },
      false,
    )
  }, [])

  return {
    unreadCount: data?.unreadCount ?? 0,
    hasUnread: data?.hasUnread ?? false,
    isLoadingUnreadState: isLoading,
    unreadStateError: isError,
    refreshUnreadState,
    resetUnreadState,
  }
}
