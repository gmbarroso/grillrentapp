"use client"

import { useCallback, useMemo, useState } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { Booking } from "../../types"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"
import { formatBookingDateKey } from "../../utils/booking-datetime"

const API_BASE_URL = getApiBaseUrl()
const ADMIN_BOOKED_DATES_ENDPOINT = `${API_BASE_URL}/bookeddates`

interface BookedDatesResponse {
  data: Booking[]
  total: number
  page: number | string
  lastPage: number | string
}

interface UseAdminBookedDatesOptions {
  initialLimit?: number
}

export function useAdminBookedDates(options?: UseAdminBookedDatesOptions) {
  const authenticatedFetch = useAuthenticatedFetch()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(options?.initialLimit ?? 10)
  const [sort, setSort] = useState("startTime")
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC")
  const [query, setQuery] = useState("")
  const todayKey = formatBookingDateKey(new Date())

  const dateRange = useMemo(() => {
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 3)

    return {
      startDate: formatBookingDateKey(startDate),
      endDate: formatBookingDateKey(endDate),
    }
  }, [todayKey])

  const url = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(limit))
    params.set("sort", sort)
    params.set("order", order)
    params.set("startDate", dateRange.startDate)
    params.set("endDate", dateRange.endDate)
    if (query.trim()) {
      params.set("q", query.trim())
    }
    return `${ADMIN_BOOKED_DATES_ENDPOINT}?${params.toString()}`
  }, [dateRange.endDate, dateRange.startDate, limit, order, page, query, sort])

  const fetcher = useCallback(
    async (targetUrl: string): Promise<BookedDatesResponse> => {
      logApiRequest("GET", targetUrl)
      try {
        const response = await authenticatedFetch(targetUrl)
        if (!response.ok) {
          throw new Error(`Failed to load booked dates: ${response.status}`)
        }

        const data = (await response.json()) as BookedDatesResponse
        logApiResponse(targetUrl, response.status, { total: data.total })
        return data
      } catch (error) {
        throw handleApiError(error, targetUrl)
      }
    },
    [authenticatedFetch],
  )

  const { data, isLoading, isError, mutate } = useFetch<BookedDatesResponse>(url, { fetcher })
  const resolvedPage = useMemo(() => {
    const rawPage = data?.page ?? page
    const numericPage = Number(rawPage)
    return Number.isFinite(numericPage) && numericPage > 0 ? numericPage : 1
  }, [data?.page, page])
  const resolvedLastPage = useMemo(() => {
    const numericLastPage = Number(data?.lastPage)
    if (!Number.isFinite(numericLastPage) || numericLastPage < 1) return 1
    return Math.floor(numericLastPage)
  }, [data?.lastPage])

  return {
    bookings: data?.data || [],
    total: data?.total || 0,
    page: resolvedPage,
    lastPage: resolvedLastPage,
    limit,
    sort,
    order,
    query,
    isLoading,
    isError,
    setPage: useCallback((next: number) => {
      setPage(Math.max(1, next))
    }, []),
    setLimit: useCallback((next: number) => {
      setLimit(next)
      setPage(1)
    }, []),
    setSort: useCallback((next: string) => {
      setSort(next)
      setPage(1)
    }, []),
    setOrder: useCallback((next: "ASC" | "DESC") => {
      setOrder(next)
      setPage(1)
    }, []),
    setQuery: useCallback((next: string) => {
      setQuery(next)
      setPage(1)
    }, []),
    refreshBookedDates: useCallback(() => mutate(), [mutate]),
  }
}
