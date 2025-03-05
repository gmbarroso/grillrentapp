import type { SWRConfiguration } from "swr"

export const swrConfig: SWRConfiguration = {
  fetcher: (url: string) => fetch(url).then((res) => res.json()),
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
}

