import useSWR, { type SWRConfiguration } from "swr"
import { swrConfig } from "../config/swr-config"

export function useFetch<Data = any, Error = any>(key: string | null, config?: SWRConfiguration<Data, Error>) {
  const { data, error, mutate, isValidating } = useSWR<Data, Error>(key, {
    ...swrConfig,
    ...config,
  })

  return {
    data,
    isLoading: isValidating,
    isError: error,
    mutate,
  }
}



