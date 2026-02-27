// This file contains utility functions for API requests and logging
// and is used in various hooks throughout the application.
// I don't like this approach, but I it was the way that I found to
// deal with CORS problem that I had.
// I will try to find a better solution in the future
let unauthorizedSignalSent = false
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized"

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
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, { detail: { source } }))
}

export const resetUnauthorizedSignal = (): void => {
  unauthorizedSignalSent = false
}

export const fetchWithAuthHandling = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options)

  if (response.status === 401) {
    signalUnauthorizedOnce(url)
  }

  return response
}

export const logApiRequest = (method: string, endpoint: string, data?: any): void => {
  console.log(`[API] ${method} ${endpoint}`)
  if (data) {
    console.log(`[API] Request data:`, data)
  }
}

export const logApiResponse = (endpoint: string, status: number, data?: any): void => {
  console.log(`[API] Response from ${endpoint}: ${status}`)
  if (data) {
    console.log(`[API] Response data:`, data)
  }
}

export const handleApiError = (error: any, endpoint: string): Error => {
  if (
    error.message &&
    (error.message.includes("CORS") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch"))
  ) {
    console.error(`[API] CORS error when accessing ${endpoint}:`, error)
    return new Error(
      `CORS error: Unable to access the API. Please check your network connection and API configuration.`,
    )
  }

  console.error(`[API] Error accessing ${endpoint}:`, error)
  return error instanceof Error ? error : new Error(`Unknown error accessing ${endpoint}`)
}
