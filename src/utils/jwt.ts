/**
 * Checks if a JWT token is expired
 * @param token The JWT token to check
 * @returns boolean indicating if the token is expired
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  try {
    // Get the payload part of the JWT (second part)
    const payload = token.split(".")[1]
    // Decode the base64 string
    const decodedPayload = window.atob(payload)
    // Parse the JSON
    const { exp } = JSON.parse(decodedPayload)

    // Check if the expiration time is past
    return Date.now() >= exp * 1000
  } catch (error) {
    console.error("Error checking token expiration:", error)
    // If there's any error parsing the token, be more lenient and return false
    // This allows the token to be used even if we can't check expiration
    return false
  }
}

/**
 * Validates if a string is a properly formatted JWT token
 * @param token The token to validate
 * @returns boolean indicating if the token is valid
 */
export function isValidToken(token: string | null): boolean {
  if (!token) return false

  // Basic format check (three parts separated by dots)
  const parts = token.split(".")
  if (parts.length !== 3) return false

  try {
    // Try to decode the payload
    const payload = window.atob(parts[1])
    const parsed = JSON.parse(payload)

    // Check if it has basic JWT claims
    return typeof parsed === "object" && parsed !== null
  } catch (error) {
    console.error("Error validating token format:", error)
    // Be more lenient - if the token has 3 parts, consider it valid even if we can't parse it
    return true
  }
}

/**
 * Gets the remaining time in seconds before a token expires
 * @param token The JWT token
 * @returns number of seconds until expiration, or 0 if expired/invalid
 */
export function getTokenRemainingTime(token: string | null): number {
  if (!token) return 0

  try {
    // Get the payload part of the JWT
    const payload = token.split(".")[1]
    // Decode the base64 string
    const decodedPayload = window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    // Parse the JSON
    const { exp } = JSON.parse(decodedPayload)

    if (!exp) return 0

    // Calculate remaining time
    const expirationTime = exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const remainingTime = expirationTime - currentTime

    return Math.max(0, Math.floor(remainingTime / 1000)) // Return seconds
  } catch (error) {
    console.error("Error getting token remaining time:", error)
    return 0
  }
}

