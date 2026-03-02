const CSRF_COOKIE_NAME = "grillrent_csrf"
const CSRF_STORAGE_KEY = "csrf_token"
let inMemoryCsrfToken: string | null = null

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null
  const cookies = document.cookie ? document.cookie.split(";") : []

  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split("=")
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

const hasStorage = (): boolean => typeof window !== "undefined" && !!window.localStorage

export const isStateChangingMethod = (method?: string): boolean =>
  ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase())

export const persistCsrfToken = (token: string): void => {
  if (!token) return
  inMemoryCsrfToken = token
  if (!hasStorage()) return
  localStorage.setItem(CSRF_STORAGE_KEY, token)
}

export const clearStoredCsrfToken = (): void => {
  inMemoryCsrfToken = null
  if (!hasStorage()) return
  localStorage.removeItem(CSRF_STORAGE_KEY)
}

const readStoredCsrfToken = (): string | null => {
  if (inMemoryCsrfToken) return inMemoryCsrfToken
  if (!hasStorage()) return null
  const storedToken = localStorage.getItem(CSRF_STORAGE_KEY)
  inMemoryCsrfToken = storedToken
  return storedToken
}

export const readCsrfToken = (): string | null => readCookie(CSRF_COOKIE_NAME) || readStoredCsrfToken()
