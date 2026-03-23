"use client"

import { useCallback, useMemo, useState } from "react"
import { mutate as mutateSWRCache } from "swr"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { ContactMessageCategory, ContactMessageStatus, Message, MessageReply } from "../../types"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()
const ADMIN_MESSAGES_ENDPOINT = `${API_BASE_URL}/messages/admin`
const RESIDENT_MESSAGES_ENDPOINT = `${API_BASE_URL}/messages/mine`
const MESSAGE_UNREAD_ENDPOINT = `${API_BASE_URL}/messages/unread-count`

interface MessageListResponse {
  data: Message[]
  total: number
  page: number
  lastPage: number
}

interface ContactMessagePayload {
  subject: string
  category: ContactMessageCategory
  content: string
  attachments?: string[]
}

interface ReplyMessagePayload {
  content: string
  sendViaEmail?: boolean
}

export function useAdminMessages() {
  const authenticatedFetch = useAuthenticatedFetch()
  const [category, setCategory] = useState<ContactMessageCategory | "all">("all")
  const [status, setStatus] = useState<ContactMessageStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const url = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(limit))
    if (category !== "all") params.set("category", category)
    if (status !== "all") params.set("status", status)
    return `${ADMIN_MESSAGES_ENDPOINT}?${params.toString()}`
  }, [category, status, page, limit])

  const fetcher = useCallback(
    async (targetUrl: string): Promise<MessageListResponse> => {
      logApiRequest("GET", targetUrl)
      try {
        const response = await authenticatedFetch(targetUrl)
        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`)
        }

        const data = (await response.json()) as MessageListResponse
        logApiResponse(targetUrl, response.status, { total: data.total })
        return data
      } catch (error) {
        throw handleApiError(error, targetUrl)
      }
    },
    [authenticatedFetch],
  )

  const { data, isLoading, isError, mutate } = useFetch<MessageListResponse>(url, {
    fetcher,
    revalidateOnFocus: true,
  })

  const refreshMessages = useCallback(() => mutate(), [mutate])

  const markMessageAsRead = useCallback(
    async (messageId: string): Promise<Message> => {
      const endpoint = `${API_BASE_URL}/messages/${messageId}/mark-read`
      logApiRequest("POST", endpoint)

      try {
        const response = await authenticatedFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error(`Failed to mark message as read: ${response.status}`)
        }

        const payload = (await response.json()) as Message
        logApiResponse(endpoint, response.status, payload)

        await mutate()
        await mutateSWRCache(MESSAGE_UNREAD_ENDPOINT)
        return payload
      } catch (error) {
        throw handleApiError(error, endpoint)
      }
    },
    [authenticatedFetch, mutate],
  )

  const replyToMessage = useCallback(
    async (messageId: string, payload: ReplyMessagePayload): Promise<MessageReply> => {
      const endpoint = `${API_BASE_URL}/messages/${messageId}/replies`
      logApiRequest("POST", endpoint, payload)

      try {
        const response = await authenticatedFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Failed to send reply: ${response.status}`)
        }

        const data = (await response.json()) as MessageReply
        logApiResponse(endpoint, response.status, data)

        await mutate()
        await mutateSWRCache(MESSAGE_UNREAD_ENDPOINT)
        return data
      } catch (error) {
        throw handleApiError(error, endpoint)
      }
    },
    [authenticatedFetch, mutate],
  )

  return {
    messages: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    lastPage: data?.lastPage || 1,
    limit,
    isLoading,
    isError,
    category,
    status,
    setCategory: (next: ContactMessageCategory | "all") => {
      setCategory(next)
      setPage(1)
    },
    setStatus: (next: ContactMessageStatus | "all") => {
      setStatus(next)
      setPage(1)
    },
    setPage: (next: number) => setPage(Math.max(1, next)),
    setLimit: (next: number) => {
      setLimit(next)
      setPage(1)
    },
    refreshMessages,
    markMessageAsRead,
    replyToMessage,
    deleteMessage: useCallback(
      async (messageId: string): Promise<{ success: true }> => {
        const endpoint = `${API_BASE_URL}/messages/${messageId}`
        logApiRequest("DELETE", endpoint)

        try {
          const response = await authenticatedFetch(endpoint, {
            method: "DELETE",
          })

          if (!response.ok) {
            throw new Error(`Failed to delete message: ${response.status}`)
          }

          const payload = (await response.json()) as { success: true }
          logApiResponse(endpoint, response.status, payload)

          await mutate()
          await mutateSWRCache(MESSAGE_UNREAD_ENDPOINT)
          return payload
        } catch (error) {
          throw handleApiError(error, endpoint)
        }
      },
      [authenticatedFetch, mutate],
    ),
  }
}

export function useCreateContactMessage() {
  const authenticatedFetch = useAuthenticatedFetch()

  const createContactMessage = useCallback(
    async (payload: ContactMessagePayload): Promise<Message> => {
      const endpoint = `${API_BASE_URL}/messages/contact`
      logApiRequest("POST", endpoint, payload)

      try {
        const response = await authenticatedFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Failed to send contact message: ${response.status}`)
        }

        const data = (await response.json()) as Message
        logApiResponse(endpoint, response.status, data)
        return data
      } catch (error) {
        throw handleApiError(error, endpoint)
      }
    },
    [authenticatedFetch],
  )

  return { createContactMessage }
}

export function useResidentMessages() {
  const authenticatedFetch = useAuthenticatedFetch()
  const [category, setCategory] = useState<ContactMessageCategory | "all">("all")
  const [status, setStatus] = useState<ContactMessageStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const url = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(limit))
    if (category !== "all") params.set("category", category)
    if (status !== "all") params.set("status", status)
    return `${RESIDENT_MESSAGES_ENDPOINT}?${params.toString()}`
  }, [category, status, page, limit])

  const fetcher = useCallback(
    async (targetUrl: string): Promise<MessageListResponse> => {
      logApiRequest("GET", targetUrl)
      try {
        const response = await authenticatedFetch(targetUrl)
        if (!response.ok) {
          throw new Error(`Failed to load resident messages: ${response.status}`)
        }

        const data = (await response.json()) as MessageListResponse
        logApiResponse(targetUrl, response.status, { total: data.total })
        return data
      } catch (error) {
        throw handleApiError(error, targetUrl)
      }
    },
    [authenticatedFetch],
  )

  const { data, isLoading, isError, mutate } = useFetch<MessageListResponse>(url, {
    fetcher,
    revalidateOnFocus: true,
  })

  const replyToMessage = useCallback(
    async (messageId: string, payload: ReplyMessagePayload): Promise<MessageReply> => {
      const endpoint = `${API_BASE_URL}/messages/${messageId}/replies/mine`
      logApiRequest("POST", endpoint, payload)

      try {
        const response = await authenticatedFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Failed to send resident reply: ${response.status}`)
        }

        const data = (await response.json()) as MessageReply
        logApiResponse(endpoint, response.status, data)

        await mutate()
        return data
      } catch (error) {
        throw handleApiError(error, endpoint)
      }
    },
    [authenticatedFetch, mutate],
  )

  return {
    messages: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    lastPage: data?.lastPage || 1,
    limit,
    isLoading,
    isError,
    category,
    status,
    setCategory: (next: ContactMessageCategory | "all") => {
      setCategory(next)
      setPage(1)
    },
    setStatus: (next: ContactMessageStatus | "all") => {
      setStatus(next)
      setPage(1)
    },
    setPage: (next: number) => setPage(Math.max(1, next)),
    setLimit: (next: number) => {
      setLimit(next)
      setPage(1)
    },
    replyToMessage,
    refreshMessages: mutate,
  }
}
