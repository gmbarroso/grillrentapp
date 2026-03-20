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
  page: number
  lastPage: number
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
    return `${ADMIN_BOOKED_DATES_ENDPOINT}?${params.toString()}`
  }, [dateRange.endDate, dateRange.startDate, limit, order, page, sort])

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

  return {
    bookings: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    lastPage: data?.lastPage || 1,
    limit,
    sort,
    order,
    isLoading,
    isError,
    setPage: (next: number) => setPage(Math.max(1, next)),
    setLimit: (next: number) => {
      setLimit(next)
      setPage(1)
    },
    setSort: (next: string) => {
      setSort(next)
      setPage(1)
    },
    setOrder: (next: "ASC" | "DESC") => {
      setOrder(next)
      setPage(1)
    },
    refreshBookedDates: useCallback(() => mutate(), [mutate]),
  }
}
