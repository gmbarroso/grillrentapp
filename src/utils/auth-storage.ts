const TOKEN_KEY = "access_token"

const hasStorage = (): boolean => typeof window !== "undefined" && !!window.localStorage

export const readStoredAccessToken = (): string | null => {
  if (!hasStorage()) return null

  return localStorage.getItem(TOKEN_KEY)
}

export const persistAccessToken = (token: string): void => {
  if (!hasStorage()) return

  localStorage.setItem(TOKEN_KEY, token)
}

export const clearStoredAccessToken = (): void => {
  if (!hasStorage()) return

  localStorage.removeItem(TOKEN_KEY)
}
