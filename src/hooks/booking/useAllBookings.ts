"use client"

import { useState, useCallback, useMemo } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { Booking } from "../../types/Booking"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

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
  const [clientSideSorting, setClientSideSorting] = useState(false)
  const authenticatedFetch = useAuthenticatedFetch()

  // Determine if we need client-side sorting
  const needsClientSideSorting = currentSort === "resourceType" || currentSort === "userApartment"

  // Use a server-side sort field that works
  const serverSideSort = needsClientSideSorting ? "startTime" : currentSort

  const fetcher = useCallback(
    async (url: string) => {
      try {
        // Replace the sort parameter in the URL if needed
        const finalUrl = needsClientSideSorting ? url.replace(`sort=${currentSort}`, `sort=${serverSideSort}`) : url

        const res = await authenticatedFetch(finalUrl)
        if (!res.ok) {
          throw new Error("Failed to fetch bookings")
        }

        const data = await res.json()

        // Apply client-side sorting if needed
        if (needsClientSideSorting && data.data && data.data.length > 0) {
          data.data = sortBookingsClientSide(data.data, currentSort, currentOrder)
        }

        return data
      } catch (error) {
        console.error("Error fetching bookings:", error)
        throw error
      }
    },
    [authenticatedFetch, currentSort, currentOrder, needsClientSideSorting, serverSideSort],
  )

  const url = useMemo(
    () =>
      `${API_BASE_URL}/bookings?page=${currentPage}&limit=${currentLimit}&sort=${currentSort}&order=${currentOrder}`,
    [currentPage, currentLimit, currentSort, currentOrder],
  )

  const { data, isError, isLoading, mutate } = useFetch<BookingsResponse>(url, { fetcher })

  // Function to sort bookings on the client side. I don't like this function
  // because it's not very flexible and doesn't handle all possible sort fields.
  // It's also not very efficient for large datasets.
  const sortBookingsClientSide = (bookings: Booking[], sortField: string, sortOrder: "ASC" | "DESC"): Booking[] => {
    return [...bookings].sort((a, b) => {
      let valueA, valueB

      if (sortField === "resourceType") {
        valueA = a.resourceType
        valueB = b.resourceType
      } else if (sortField === "userApartment") {
        valueA = a.userApartment
        valueB = b.userApartment
      } else {
        return 0
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "ASC" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }

      if (valueA < valueB) return sortOrder === "ASC" ? -1 : 1
      if (valueA > valueB) return sortOrder === "ASC" ? 1 : -1
      return 0
    })
  }

  const changePage = (newPage: number) => setCurrentPage(newPage)
  const changeLimit = (newLimit: number) => {
    setCurrentLimit(newLimit)
    setCurrentPage(1)
  }
  const changeSort = (newSort: string) => {
    setCurrentSort(newSort)
    setClientSideSorting(newSort === "resourceType" || newSort === "userApartment")
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
    isClientSideSorting: clientSideSorting,
  }
}

