import { normalizeOrganizationSlug } from "./organizationSlug"

const TOKEN_KEY = "access_token"
const LEGACY_TOKEN_KEY = "token"
const AUTH_IDENTITY_HINT_KEY = "auth_identity_hint"
let inMemoryAccessToken: string | null = null
let inMemoryAuthIdentityHint: AuthIdentityHint | null = null

export interface AuthIdentityHint {
  organizationSlug?: string
  apartment?: string
  block?: number
}

const hasStorage = (): boolean => typeof window !== "undefined" && !!window.sessionStorage

export const readStoredAccessToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken
  if (!hasStorage()) return null

  const token = sessionStorage.getItem(TOKEN_KEY)
  inMemoryAccessToken = token
  return token
}

export const persistAccessToken = (token: string): void => {
  if (!token) return
  inMemoryAccessToken = token
  if (!hasStorage()) return

  sessionStorage.setItem(TOKEN_KEY, token)
}

export const clearStoredAccessToken = (): void => {
  inMemoryAccessToken = null
  if (!hasStorage()) return

  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(LEGACY_TOKEN_KEY)
}

const normalizeHintString = (value: unknown, maxLength = 64): string | undefined => {
  if (typeof value !== "string") return undefined
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, "").trim()
  if (!normalized) return undefined
  return normalized.slice(0, maxLength)
}

const normalizeHintBlock = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export const persistAuthIdentityHint = (hint: AuthIdentityHint): void => {
  const rawSlug = normalizeHintString(hint.organizationSlug)
  const normalizedSlug = rawSlug ? normalizeOrganizationSlug(rawSlug) || undefined : undefined
  const normalizedHint: AuthIdentityHint = {
    organizationSlug: normalizedSlug,
    apartment: normalizeHintString(hint.apartment),
    block: normalizeHintBlock(hint.block),
  }
  inMemoryAuthIdentityHint = normalizedHint
  if (!hasStorage()) return

  sessionStorage.setItem(AUTH_IDENTITY_HINT_KEY, JSON.stringify(normalizedHint))
}

export const readStoredAuthIdentityHint = (): AuthIdentityHint | null => {
  if (inMemoryAuthIdentityHint) return inMemoryAuthIdentityHint
  if (!hasStorage()) return null

  const raw = sessionStorage.getItem(AUTH_IDENTITY_HINT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthIdentityHint
    const rawSlug = normalizeHintString(parsed.organizationSlug)
    const normalizedSlug = rawSlug ? normalizeOrganizationSlug(rawSlug) || undefined : undefined
    const normalizedHint: AuthIdentityHint = {
      organizationSlug: normalizedSlug,
      apartment: normalizeHintString(parsed.apartment),
      block: normalizeHintBlock(parsed.block),
    }
    inMemoryAuthIdentityHint = normalizedHint
    return normalizedHint
  } catch {
    clearStoredAuthIdentityHint()
    return null
  }
}

export const clearStoredAuthIdentityHint = (): void => {
  inMemoryAuthIdentityHint = null
  if (!hasStorage()) return
  sessionStorage.removeItem(AUTH_IDENTITY_HINT_KEY)
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
