import { authDebug, authError, sanitizeForLog, stripSensitiveQueryParams } from "./auth-logger"
import { isStateChangingMethod, readCsrfToken } from "./csrf"

let unauthorizedSignalSent = false
let runtimeBearerToken: string | null = null
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized"

export const setRuntimeBearerToken = (token: string | null): void => {
  const normalized = typeof token === "string" ? token.trim() : ""
  runtimeBearerToken = normalized.length > 0 ? normalized : null
}

export const clearRuntimeBearerToken = (): void => {
  runtimeBearerToken = null
}

export const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development"

  const isStaging =
    process.env.REACT_APP_ENVIRONMENT === "staging" ||
    window.location.hostname.includes("stg") ||
    window.location.hostname.includes("staging")

  if (isDevelopment) {
    return isStaging ? "/api-staging" : "/api"
  }

  if (isStaging) {
    return process.env.REACT_APP_BFF_URL_STAGING || "https://grillrentbffv2-staging.up.railway.app"
  }

  return process.env.REACT_APP_BFF_URL || "https://grillrentbff.up.railway.app"
}

export const signalUnauthorizedOnce = (source: string): void => {
  if (typeof window === "undefined" || unauthorizedSignalSent) return

  unauthorizedSignalSent = true
  window.dispatchEvent(
    new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { source: stripSensitiveQueryParams(source) } }),
  )
}

export const resetUnauthorizedSignal = (): void => {
  unauthorizedSignalSent = false
}

export const fetchWithAuthHandling = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = options.method || "GET"
  const headers = new Headers(options.headers || {})
  if (!headers.has("Authorization") && runtimeBearerToken) {
    headers.set("Authorization", `Bearer ${runtimeBearerToken}`)
  }

  if (isStateChangingMethod(method)) {
    const csrfToken = readCsrfToken()
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken)
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  })

  if (response.status === 401) {
    authDebug(`[API] Unauthorized response`, { endpoint: stripSensitiveQueryParams(url) })
    signalUnauthorizedOnce(url)
  }

  return response
}

export const logApiRequest = (method: string, endpoint: string, data?: any): void => {
  authDebug(`[API] ${method} ${stripSensitiveQueryParams(endpoint)}`)
  if (data) {
    authDebug(`[API] Request data`, sanitizeForLog(data))
  }
}

export const logApiResponse = (endpoint: string, status: number, data?: any): void => {
  authDebug(`[API] Response from ${stripSensitiveQueryParams(endpoint)}: ${status}`)
  if (data) {
    authDebug(`[API] Response data`, sanitizeForLog(data))
  }
}

const isLikelyNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) return true
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes("networkerror") ||
    message.includes("cors") ||
    message.includes("load failed")
  )
}

export const handleApiError = (error: any, endpoint: string): Error => {
  if (isLikelyNetworkError(error)) {
    authError(`[API] CORS error when accessing ${stripSensitiveQueryParams(endpoint)}:`, error)
    return new Error(
      `CORS error: Unable to access the API. Please check your network connection and API configuration.`,
    )
  }

  authError(`[API] Error accessing ${stripSensitiveQueryParams(endpoint)}:`, error)
  return error instanceof Error ? error : new Error(`Unknown error accessing ${endpoint}`)
}

export const extractApiErrorMessage = async (response: Response, fallbackMessage: string): Promise<string> => {
  try {
    const payload = await response.json() as { message?: unknown; error?: unknown }
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message
    }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error
    }
  } catch {
    // Ignore parse errors and return fallback below.
  }

  return fallbackMessage
}
