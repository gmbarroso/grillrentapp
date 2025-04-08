"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { Booking } from "../../types/Booking"
import { getApiBaseUrl } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

interface BookingsResponse {
  data: Booking[]
  total: number
  page: string
  lastPage: number
}

export function useAllBookings(token: string) {
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[useAllBookings] Render count: ${renderCount.current}`)
  console.log(`[useAllBookings] Using API base URL: ${API_BASE_URL}`)

  const [currentPage, setCurrentPage] = useState(1)
  const [currentLimit, setCurrentLimit] = useState(20)
  const [currentSort, setCurrentSort] = useState("startTime")
  const [currentOrder, setCurrentOrder] = useState<"ASC" | "DESC">("ASC")
  const authenticatedFetch = useAuthenticatedFetch()

  const fetcher = useCallback(
    async (url: string) => {
      console.log(`[useAllBookings] Fetching data from: ${url}`)
      try {
        const res = await authenticatedFetch(url)
        if (!res.ok) {
          throw new Error("Failed to fetch bookings")
        }
        const data = await res.json()
        console.log(`[useAllBookings] Fetch successful, received ${data?.data?.length || 0} bookings`)
        return data
      } catch (error) {
        console.error("[useAllBookings] Error fetching bookings:", error)
        throw error
      }
    },
    [authenticatedFetch],
  )

  const url = useMemo(() => {
    const constructedUrl = `${API_BASE_URL}/bookings?page=${currentPage}&limit=${currentLimit}&sort=${currentSort}&order=${currentOrder}`
    console.log(`[useAllBookings] URL constructed: ${constructedUrl}`)
    return constructedUrl
  }, [currentPage, currentLimit, currentSort, currentOrder])

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
