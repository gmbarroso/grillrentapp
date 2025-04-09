"use client"

import { useState, useCallback, useMemo } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { Notice } from "../../types/Notice"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

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
      logApiRequest("GET", url)
      try {
        const res = await authenticatedFetch(url)
        if (!res.ok) {
          throw new Error("Failed to fetch notices")
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
