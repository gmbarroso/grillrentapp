const TOKEN_KEY = "access_token"
const LEGACY_TOKEN_KEY = "token"
let inMemoryAccessToken: string | null = null

const hasStorage = (): boolean => typeof window !== "undefined" && !!window.localStorage

export const readStoredAccessToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken
  if (!hasStorage()) return null

  const token = localStorage.getItem(TOKEN_KEY)
  inMemoryAccessToken = token
  return token
}

export const persistAccessToken = (token: string): void => {
  if (!token) return
  inMemoryAccessToken = token
  if (!hasStorage()) return

  localStorage.setItem(TOKEN_KEY, token)
}

export const clearStoredAccessToken = (): void => {
  inMemoryAccessToken = null
  if (!hasStorage()) return

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export const stripAccessTokenFromUrl = (): boolean => {
  if (typeof window === "undefined") return false
  if (!window.location.search && !window.location.hash) return false

  let modified = false
  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)

  ;["token", "access_token", "id_token"].forEach((key) => {
    if (searchParams.has(key)) {
      searchParams.delete(key)
      modified = true
    }
  })

  const hash = window.location.hash.startsWith("#") ? window.location.hash.substring(1) : window.location.hash
  const hashParams = new URLSearchParams(hash)
  ;["token", "access_token", "id_token"].forEach((key) => {
    if (hashParams.has(key)) {
      hashParams.delete(key)
      modified = true
    }
  })

  if (!modified) return false

  const nextSearch = searchParams.toString()
  const nextHash = hashParams.toString()
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${nextHash ? `#${nextHash}` : ""}`
  window.history.replaceState({}, document.title, nextUrl)
  return true
}
