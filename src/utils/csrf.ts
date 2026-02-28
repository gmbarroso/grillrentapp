const CSRF_COOKIE_NAME = "grillrent_csrf"

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

export const isStateChangingMethod = (method?: string): boolean =>
  ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase())

export const readCsrfToken = (): string | null => readCookie(CSRF_COOKIE_NAME)
