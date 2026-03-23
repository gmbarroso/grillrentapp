"use client"

import useSWR, { type SWRConfiguration } from "swr"
import { swrConfig } from "../config/swr-config"
import { useCallback } from "react"

export function useFetch<Data = any, Error = any>(key: string | null, config?: SWRConfiguration<Data, Error>) {
  const finalFetcher = useCallback(
    (url: string) => {
      if (config?.fetcher) {
        return config.fetcher(url)
      }
      if (swrConfig.fetcher) {
        return swrConfig.fetcher(url)
      }
      throw new Error("[useFetch] Fetcher is not defined in swrConfig.")
    },
    [config?.fetcher],
  )

  const { data, error, mutate, isValidating, isLoading: swrIsLoading } = useSWR<Data, Error>(key, finalFetcher, {
    ...swrConfig,
    ...config,
    fetcher: undefined,
  })

  return {
    data,
    isLoading: swrIsLoading || (Boolean(key) && typeof data === "undefined" && !error) || isValidating,
    isError: error,
    mutate,
  }
}
