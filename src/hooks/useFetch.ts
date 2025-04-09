"use client"

import useSWR, { type SWRConfiguration } from "swr"
import { swrConfig } from "../config/swr-config"
import { useRef, useEffect } from "react"

// I had some problems dealing with re-renders loop.
// So I added a throttle mechanism to prevent excessive renders and
// I commented out the code below for future reference.

export function useFetch<Data = any, Error = any>(key: string | null, config?: SWRConfiguration<Data, Error>) {
  // Add render counter for debugging
  const renderCount = useRef(0)
  renderCount.current++

  // Add request tracking to prevent infinite loops
  const requestCount = useRef<Record<string, number>>({})
  const MAX_REQUESTS_PER_KEY = 10
  const RESET_INTERVAL = 10000 // 10 seconds

  // Log only if not excessive to avoid console spam
  if (renderCount.current < 100 || renderCount.current % 1000 === 0) {
    console.log(`[useFetch] Render count: ${renderCount.current}, key: ${key}`)
  }

  // Reset request counts periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      requestCount.current = {}
    }, RESET_INTERVAL)

    return () => clearInterval(intervalId)
  }, [])

  // Add throttling for frequent fetches
  const lastFetchTime = useRef<Record<string, number>>({})
  const THROTTLE_TIME = 2000

  // Custom fetcher that implements throttling and prevents infinite loops
  const throttledFetcher = (url: string, customFetcher?: any) => {
    const now = Date.now()
    const lastTime = lastFetchTime.current[url] || 0

    // Track request count for this URL
    requestCount.current[url] = (requestCount.current[url] || 0) + 1

    // If we've made too many requests to this URL, block it
    if (requestCount.current[url] > MAX_REQUESTS_PER_KEY) {
      console.warn(
        `[useFetch] Too many requests (${requestCount.current[url]}) for URL: ${url}. Blocking to prevent infinite loop.`,
      )
      return Promise.resolve(null)
    }

    // If we've fetched this URL recently, throttle the request
    if (now - lastTime < THROTTLE_TIME) {
      console.log(`[useFetch] Throttling fetch for: ${url}`)
      return Promise.resolve(null)
    }

    // Update the last fetch time
    lastFetchTime.current[url] = now

    // Use the custom fetcher if provided, otherwise use the default one
    if (customFetcher) {
      return customFetcher(url)
    }

    if (swrConfig.fetcher) {
      return swrConfig.fetcher(url)
    } else {
      throw new Error("[useFetch] Fetcher is not defined in swrConfig.")
    }
  }

  // Determine which fetcher to use
  const finalFetcher = config?.fetcher
    ? (url: string) => throttledFetcher(url, config.fetcher)
    : (url: string) => throttledFetcher(url)

  const { data, error, mutate, isValidating } = useSWR<Data, Error>(key, finalFetcher, {
    ...swrConfig,
    ...config,
    fetcher: undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  })

  return {
    data,
    isLoading: isValidating,
    isError: error,
    mutate,
  }
}
