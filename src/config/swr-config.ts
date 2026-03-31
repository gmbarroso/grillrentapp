import type { SWRConfiguration } from "swr"

export const swrConfig: SWRConfiguration = {
  fetcher: async (url: string) => {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    })
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response.json()
  },
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 5000,
  shouldRetryOnError: false,
  focusThrottleInterval: 10000,
}
