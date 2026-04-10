import { useCallback, useMemo, useState } from "react"
import { useFetch } from "../useFetch"
import { useAuthenticatedFetch } from "../useAuthenticatedFetch"
import type { User } from "../../types"
import { getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()
const USERS_ENDPOINT = `${API_BASE_URL}/users`

interface UsersListResponse {
  data: User[]
  total: number
  page: number | string
  lastPage: number | string
}

interface UseAllUsersOptions {
  initialLimit?: number
}

export function useAllUsers(options?: UseAllUsersOptions) {
  const authenticatedFetch = useAuthenticatedFetch()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(options?.initialLimit ?? 10)
  const [sort, setSort] = useState("name")
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC")
  const [query, setQuery] = useState("")

  const url = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(limit))
    params.set("sort", sort)
    params.set("order", order)
    if (query.trim()) {
      params.set("q", query.trim())
    }

    return `${USERS_ENDPOINT}?${params.toString()}`
  }, [limit, order, page, query, sort])

  const fetcher = useCallback(
    async (targetUrl: string): Promise<UsersListResponse> => {
      logApiRequest("GET", targetUrl)
      try {
        const response = await authenticatedFetch(targetUrl)
        if (!response.ok) {
          throw new Error(`Failed to load users: ${response.status}`)
        }

        const payload = (await response.json()) as UsersListResponse
        logApiResponse(targetUrl, response.status, { total: payload.total })
        return payload
      } catch (error) {
        throw handleApiError(error, targetUrl)
      }
    },
    [authenticatedFetch],
  )

  const { data, isLoading, isError, mutate } = useFetch<UsersListResponse>(url, {
    fetcher,
    revalidateOnFocus: true,
  })

  const resolvedPage = useMemo(() => {
    const numericPage = Number(data?.page ?? page)
    return Number.isFinite(numericPage) && numericPage > 0 ? Math.floor(numericPage) : 1
  }, [data?.page, page])

  const resolvedLastPage = useMemo(() => {
    const numericLastPage = Number(data?.lastPage)
    if (!Number.isFinite(numericLastPage) || numericLastPage < 1) return 1
    return Math.floor(numericLastPage)
  }, [data?.lastPage])

  return {
    users: data?.data || [],
    total: data?.total || 0,
    page: resolvedPage,
    lastPage: resolvedLastPage,
    limit,
    sort,
    order,
    query,
    isLoading,
    isError,
    setPage: useCallback((next: number) => setPage(Math.max(1, next)), []),
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
    refreshUsers: useCallback(() => mutate(), [mutate]),
  }
}
