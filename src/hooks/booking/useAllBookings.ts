"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { Booking } from "../../types/Booking"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface BookingsResponse {
  data: Booking[]
  total: number
  page: string
  lastPage: number
}

export function useAllBookings(token: string) {
  // Add render counter for debugging
  const renderCount = useRef(0)
  renderCount.current++

  if (renderCount.current < 100 || renderCount.current % 1000 === 0) {
    console.log(`[useAllBookings] Render count: ${renderCount.current}`)
    console.log(`[useAllBookings] Using API base URL: ${API_BASE_URL}`)
  }

  const [currentPage, setCurrentPage] = useState(1)
  const [currentLimit, setCurrentLimit] = useState(20)
  const [currentSort, setCurrentSort] = useState("startTime")
  const [currentOrder, setCurrentOrder] = useState<"ASC" | "DESC">("ASC")
  const authenticatedFetch = useAuthenticatedFetch()

  // Calculate date range for three months
  const dateRange = useMemo(() => {
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 3)

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    }
  }, [])

  // Memoize the fetcher function to prevent recreation on every render
  const fetcher = useCallback(
    async (url: string) => {
      logApiRequest("GET", url)
      try {
        const res = await authenticatedFetch(url)
        if (!res.ok) {
          throw new Error("Failed to fetch bookings")
        }
        const data = await res.json()
        logApiResponse(url, res.status, { count: data?.data?.length || 0 })
        return data
      } catch (error) {
        const apiError = handleApiError(error, url)
        throw apiError
      }
    },
    [authenticatedFetch],
  )

  // Memoize the URL construction to prevent it from changing on every render
  // Include the date range parameters
  const url = useMemo(() => {
    const constructedUrl = `${API_BASE_URL}/bookings?page=${currentPage}&limit=${currentLimit}&sort=${currentSort}&order=${currentOrder}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    return constructedUrl
  }, [currentPage, currentLimit, currentSort, currentOrder, dateRange])

  const { data, isError, isLoading, mutate } = useFetch<BookingsResponse>(url, { fetcher })

  const changePage = useCallback((newPage: number) => {
    console.log(`[useAllBookings] Changing page to: ${newPage}`)
    setCurrentPage(newPage)
  }, [])

  const changeLimit = useCallback((newLimit: number) => {
    console.log(`[useAllBookings] Changing limit to: ${newLimit}`)
    setCurrentLimit(newLimit)
    setCurrentPage(1)
  }, [])

  const changeSort = useCallback((newSort: string) => {
    console.log(`[useAllBookings] Changing sort to: ${newSort}`)
    setCurrentSort(newSort)
    setCurrentPage(1)
  }, [])

  const changeOrder = useCallback((newOrder: "ASC" | "DESC") => {
    console.log(`[useAllBookings] Changing order to: ${newOrder}`)
    setCurrentOrder(newOrder)
    setCurrentPage(1)
  }, [])

  const refreshBookings = useCallback(() => {
    console.log(`[useAllBookings] Refreshing bookings data`)
    return mutate()
  }, [mutate])

  return {
    bookings: data?.data || [],
    total: data?.total || 0,
    currentPage: Number(data?.page) || currentPage,
    lastPage: data?.lastPage || 1,
    isLoading,
    isError,
    currentLimit,
    currentSort,
    currentOrder,
    changePage,
    changeLimit,
    changeSort,
    changeOrder,
    refreshBookings,
  }
}
