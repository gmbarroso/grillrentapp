"use client"

import useSWR, { type SWRConfiguration } from "swr"
import { swrConfig } from "../config/swr-config"
import { useRef } from "react"

// I had some problems dealing with re-renders loop.
// So I added a throttle mechanism to prevent excessive renders and
// I commented out the code below for future reference.

export function useFetch<Data = any, Error = any>(key: string | null, config?: SWRConfiguration<Data, Error>) {
  // Add render counter for debugging
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[useFetch] Render count: ${renderCount.current}, key: ${key}`)

  // Add throttling for frequent fetches
  const lastFetchTime = useRef<Record<string, number>>({})

  // Custom fetcher that implements throttling
  const throttledFetcher = (url: string, customFetcher?: any) => {
    const now = Date.now()
    const lastTime = lastFetchTime.current[url] || 0

    // If we've fetched this URL recently, throttle the request
    if (now - lastTime < 1000) {
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
  })

  return {
    data,
    isLoading: isValidating,
    isError: error,
    mutate,
  }
}

