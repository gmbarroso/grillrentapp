"use client"

import { useCallback } from "react"
import { mutate as mutateSWRCache } from "swr"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()
const UNREAD_COUNT_ENDPOINT = `${API_BASE_URL}/notices/unread-count`
const NOTICE_LIST_ENDPOINT_PREFIX = `${API_BASE_URL}/notices?`
const NOTICE_READ_TRACKING_ENABLED = import.meta.env.VITE_NOTICES_READ_TRACKING !== "false"

interface NoticeUnreadStateResponse {
  unreadCount: number
  lastSeenNoticesAt: string | null
}

interface MarkSeenResponse {
  markedAsSeenAt: string
  previousLastSeenNoticesAt: string | null
}

export function isNoticeUnread(createdAt: string, lastSeenNoticesAt: string | null): boolean {
  if (!lastSeenNoticesAt) return true

  const createdTime = new Date(createdAt).getTime()
  const lastSeenTime = new Date(lastSeenNoticesAt).getTime()
  if (Number.isNaN(createdTime) || Number.isNaN(lastSeenTime)) {
    return false
  }

  return createdTime > lastSeenTime
}

export function isNoticeReadTrackingEnabled(): boolean {
  return NOTICE_READ_TRACKING_ENABLED
}

export function useNoticeUnreadState() {
  const authenticatedFetch = useAuthenticatedFetch()

  const fetcher = useCallback(
    async (url: string): Promise<NoticeUnreadStateResponse> => {
      logApiRequest("GET", url)
      try {
        const response = await authenticatedFetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch unread notice count: ${response.status}`)
        }
        const data = (await response.json()) as NoticeUnreadStateResponse
        logApiResponse(url, response.status, data)
        return data
      } catch (error) {
        throw handleApiError(error, url)
      }
    },
    [authenticatedFetch],
  )

  const { data, isError, isLoading, mutate } = useFetch<NoticeUnreadStateResponse>(
    NOTICE_READ_TRACKING_ENABLED ? UNREAD_COUNT_ENDPOINT : null,
    {
    fetcher,
    },
  )

  const refreshUnreadState = useCallback(() => mutate(), [mutate])

  return {
    unreadCount: data?.unreadCount ?? 0,
    lastSeenNoticesAt: data?.lastSeenNoticesAt ?? null,
    isLoadingUnreadState: isLoading,
    unreadStateError: isError,
    isNoticeReadTrackingEnabled: NOTICE_READ_TRACKING_ENABLED,
    refreshUnreadState,
  }
}

export function useMarkNoticesAsSeen() {
  const authenticatedFetch = useAuthenticatedFetch()

  const markNoticesAsSeen = useCallback(async (): Promise<MarkSeenResponse> => {
    if (!NOTICE_READ_TRACKING_ENABLED) {
      return {
        markedAsSeenAt: new Date().toISOString(),
        previousLastSeenNoticesAt: null,
      }
    }

    const endpoint = `${API_BASE_URL}/notices/mark-seen`
    logApiRequest("POST", endpoint)

    try {
      const response = await authenticatedFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) {
        throw new Error(`Failed to mark notices as seen: ${response.status}`)
      }

      const data = (await response.json()) as MarkSeenResponse
      logApiResponse(endpoint, response.status, data)

      await mutateSWRCache(
        UNREAD_COUNT_ENDPOINT,
        {
          unreadCount: 0,
          lastSeenNoticesAt: data.markedAsSeenAt,
        },
        false,
      )
      const unreadResponse = await authenticatedFetch(UNREAD_COUNT_ENDPOINT)
      if (unreadResponse.ok) {
        const unreadData = (await unreadResponse.json()) as NoticeUnreadStateResponse
        await mutateSWRCache(UNREAD_COUNT_ENDPOINT, unreadData, false)
      }
      await mutateSWRCache((key) => typeof key === "string" && key.startsWith(NOTICE_LIST_ENDPOINT_PREFIX))

      return data
    } catch (error) {
      throw handleApiError(error, endpoint)
    }
  }, [authenticatedFetch])

  return { markNoticesAsSeen }
}
