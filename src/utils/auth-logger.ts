const SENSITIVE_KEY_PATTERN = /(password|token|authorization|cookie|secret)/i

const readAuthDebugFlag = (): string | undefined => {
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    return (import.meta as any).env.VITE_AUTH_DEBUG
  }

  if (typeof process !== "undefined" && process.env) {
    return process.env.REACT_APP_AUTH_DEBUG
  }

  return undefined
}

export const isAuthDebugEnabled = (): boolean => {
  const flag = readAuthDebugFlag()?.toLowerCase()
  if (flag === "true" || flag === "1") return true
  if (flag === "false" || flag === "0") return false

  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    return Boolean((import.meta as any).env.DEV)
  }

  return typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : false
}

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item))
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeValue(nestedValue)
    }
    return sanitized
  }

  return value
}

export const sanitizeForLog = <T>(payload: T): T => sanitizeValue(payload) as T

export const stripSensitiveQueryParams = (input: string): string => {
  if (!input || !input.includes("?")) return input

  const [base, query] = input.split("?", 2)
  const params = new URLSearchParams(query)

  ;["token", "access_token", "id_token"].forEach((key) => {
    if (params.has(key)) params.set(key, "[REDACTED]")
  })

  const serialized = params.toString()
  return serialized ? `${base}?${serialized}` : base
}

export const authDebug = (message: string, payload?: unknown): void => {
  if (!isAuthDebugEnabled()) return

  if (typeof payload === "undefined") {
    console.debug(message)
    return
  }

  console.debug(message, sanitizeForLog(payload))
}

export const authError = (message: string, error?: unknown): void => {
  const fallback = "Unknown error"
  const safeMessage = error instanceof Error ? error.message : fallback
  console.error(message, safeMessage)
}
