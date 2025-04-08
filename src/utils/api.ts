// This file contains utility functions for API requests and logging
// and is used in various hooks throughout the application.
// I don't like this approach, but I it was the way that I found to
// deal with CORS problem that I had.
// I will try to find a better solution in the future
export const getApiBaseUrl = (): string => {
    const isStaging =
      process.env.REACT_APP_ENVIRONMENT === "staging" ||
      window.location.hostname.includes("stg") ||
      window.location.hostname.includes("staging")
  
    if (isStaging) {
      return process.env.REACT_APP_BFF_URL_STAGING || "https://grillrentbffv2-staging.up.railway.app"
    }
  
    return process.env.REACT_APP_BFF_URL || "https://grillrentbff.up.railway.app"
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
  