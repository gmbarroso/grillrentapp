"use client"

import { useState, useCallback, useMemo } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { Notice } from "../../types/Notice"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

interface NoticesResponse {
  data: Notice[]
  total: number
  page: string
  lastPage: number
}

export function useAllNotices(token: string) {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentLimit, setCurrentLimit] = useState(10)
  const [currentSort, setCurrentSort] = useState("createdAt")
  const [currentOrder, setCurrentOrder] = useState<"ASC" | "DESC">("DESC") // Newest first
  const authenticatedFetch = useAuthenticatedFetch()

  const fetcher = useCallback(
    async (url: string) => {
      try {
        const res = await authenticatedFetch(url)
        if (!res.ok) {
          throw new Error("Failed to fetch notices")
        }
        return res.json()
      } catch (error) {
        console.error("Error fetching notices:", error)
        throw error
      }
    },
    [authenticatedFetch],
  )

  const url = useMemo(
    () => `${API_BASE_URL}/notices?page=${currentPage}&limit=${currentLimit}&sort=${currentSort}&order=${currentOrder}`,
    [currentPage, currentLimit, currentSort, currentOrder],
  )

  const { data, isError, isLoading, mutate } = useFetch<NoticesResponse>(url, { fetcher })

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

  const refreshNotices = useCallback(() => {
    return mutate()
  }, [mutate])

  return {
    notices: data?.data || [],
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
    refreshNotices,
  }
}

