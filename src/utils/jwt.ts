import { authError } from "./auth-logger"

const decodeBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")

  if (typeof atob === "function") {
    return atob(normalized)
  }

  return Buffer.from(normalized, "base64").toString("utf-8")
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  try {
    const payload = token.split(".")[1]
    const decodedPayload = decodeBase64(payload)
    const { exp } = JSON.parse(decodedPayload)

    return Date.now() >= exp * 1000
  } catch (error) {
    authError("[Auth] Error checking token expiration:", error)
    return true
  }
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false

  const parts = token.split(".")
  if (parts.length !== 3) return false

  try {
    const payload = decodeBase64(parts[1])
    const parsed = JSON.parse(payload)

    return typeof parsed === "object" && parsed !== null
  } catch (error) {
    authError("[Auth] Error validating token format:", error)
    return false
  }
}

export function getTokenRemainingTime(token: string | null): number {
  if (!token) return 0

  try {
    const payload = token.split(".")[1]
    const decodedPayload = decodeBase64(payload)
    const { exp } = JSON.parse(decodedPayload)

    if (!exp) return 0

    const expirationTime = exp * 1000
    const currentTime = Date.now()
    const remainingTime = expirationTime - currentTime

    return Math.max(0, Math.floor(remainingTime / 1000))
  } catch (error) {
    authError("[Auth] Error getting token remaining time:", error)
    return 0
  }
}
