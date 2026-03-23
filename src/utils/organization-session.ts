const ORGANIZATION_SLUG_KEY = "organization_slug"

const hasStorage = (): boolean => typeof window !== "undefined" && !!window.localStorage

export const readStoredOrganizationSlug = (): string => {
  if (!hasStorage()) return ""
  return localStorage.getItem(ORGANIZATION_SLUG_KEY) || ""
}

export const persistOrganizationSlug = (slug: string): void => {
  if (!hasStorage()) return
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return
  localStorage.setItem(ORGANIZATION_SLUG_KEY, normalized)
}
