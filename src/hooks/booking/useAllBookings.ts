import { useState, useCallback, useMemo } from "react"
import { useFetch } from "../useFetch"
import type { Booking } from "../../types/Booking"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface BookingsResponse {
  data: Booking[]
  total: number
  page: string
  lastPage: number
}

export function useAllBookings(token: string) {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentLimit, setCurrentLimit] = useState(10)
  const [currentSort, setCurrentSort] = useState("startTime")
  const [currentOrder, setCurrentOrder] = useState<"ASC" | "DESC">("ASC")

  const fetcher = useCallback(
    (url: string) =>
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch bookings")
        }
        return res.json()
      }),
    [token],
  )

  const url = useMemo(
    () =>
      `${API_BASE_URL}/bookings?page=${currentPage}&limit=${currentLimit}&sort=${currentSort}&order=${currentOrder}`,
    [currentPage, currentLimit, currentSort, currentOrder],
  )

  const { data, isError, isLoading, mutate } = useFetch<BookingsResponse>(url, { fetcher })

  const changePage = (newPage: number) => setCurrentPage(newPage)
  const changeLimit = (newLimit: number) => {
    setCurrentLimit(newLimit)
    setCurrentPage(1)
  }
  const changeSort = (newSort: string) => {
    setCurrentSort(newSort)
    setCurrentPage(1)
  }
  const changeOrder = (newOrder: "ASC" | "DESC") => {
    setCurrentOrder(newOrder)
    setCurrentPage(1)
  }

  const refreshBookings = useCallback(() => {
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

