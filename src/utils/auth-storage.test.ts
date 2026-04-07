import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  clearStoredAuthIdentityHint,
  clearStoredAccessToken,
  persistAuthIdentityHint,
  persistAccessToken,
  readStoredAuthIdentityHint,
  readStoredAccessToken,
  stripAccessTokenFromUrl,
} from "./auth-storage"

const createLocalStorage = () => {
  const store = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
  }
}

describe("auth storage", () => {
  let storage: ReturnType<typeof createLocalStorage>
  let replaceState: ReturnType<typeof vi.fn>

  beforeEach(() => {
    storage = createLocalStorage()
    replaceState = vi.fn()
    vi.stubGlobal("window", {
      sessionStorage: storage,
      location: {
        href: "https://example.com/home",
        pathname: "/home",
        search: "",
        hash: "",
      },
      history: {
        replaceState,
      },
    })
    vi.stubGlobal("document", { title: "Test Title" })
    vi.stubGlobal("sessionStorage", storage)
    clearStoredAccessToken()
    clearStoredAuthIdentityHint()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("reads canonical token key first", () => {
    storage.setItem("access_token", "canonical-token")

    expect(readStoredAccessToken()).toBe("canonical-token")
  })

  it("returns null when canonical key is missing", () => {
    storage.setItem("token", "legacy-token")

    expect(readStoredAccessToken()).toBeNull()
  })

  it("persists canonical key", () => {
    persistAccessToken("new-token")

    expect(storage.getItem("access_token")).toBe("new-token")
  })

  it("clears canonical key", () => {
    storage.setItem("access_token", "new-token")
    storage.setItem("token", "new-token")

    clearStoredAccessToken()

    expect(storage.getItem("access_token")).toBeNull()
    expect(storage.getItem("token")).toBeNull()
  })

  it("strips token params from URL", () => {
    ;(window.location as any).href = "https://example.com/home?access_token=abc&tab=1#token=xyz"
    ;(window.location as any).search = "?access_token=abc&tab=1"
    ;(window.location as any).hash = "#token=xyz"

    expect(stripAccessTokenFromUrl()).toBe(true)
    expect(replaceState).toHaveBeenCalledWith({}, "Test Title", "/home?tab=1")
  })

  it("persists and reads auth identity hint", () => {
    persistAuthIdentityHint({ organizationSlug: "seuze", apartment: "101", block: 2 })

    expect(readStoredAuthIdentityHint()).toEqual({
      organizationSlug: "seuze",
      apartment: "101",
      block: 2,
    })
  })

  it("normalizes organizationSlug using normalizeOrganizationSlug on persist", () => {
    persistAuthIdentityHint({ organizationSlug: "  Séuze Cond  ", apartment: "101", block: 1 })

    const hint = readStoredAuthIdentityHint()
    expect(hint?.organizationSlug).toBe("seuze-cond")
  })

  it("trims and truncates apartment hint string", () => {
    const longApartment = "A".repeat(100)
    persistAuthIdentityHint({ apartment: `  ${longApartment}  ` })

    const hint = readStoredAuthIdentityHint()
    expect(hint?.apartment).toBe("A".repeat(64))
  })

  it("strips control characters from hint strings", () => {
    persistAuthIdentityHint({ organizationSlug: "my\nslug", apartment: "101\r" })

    const hint = readStoredAuthIdentityHint()
    expect(hint?.organizationSlug).toBe("myslug")
    expect(hint?.apartment).toBe("101")
  })

  it("treats non-string organizationSlug as undefined", () => {
    persistAuthIdentityHint({ organizationSlug: undefined, apartment: "101", block: 1 })

    const hint = readStoredAuthIdentityHint()
    expect(hint?.organizationSlug).toBeUndefined()
  })

  it("treats empty organizationSlug after normalization as undefined", () => {
    persistAuthIdentityHint({ organizationSlug: "  \n\r  " })

    const hint = readStoredAuthIdentityHint()
    expect(hint?.organizationSlug).toBeUndefined()
  })

  it("returns null and clears storage when stored JSON is malformed", () => {
    storage.setItem("auth_identity_hint", "not-valid-json{")

    const result = readStoredAuthIdentityHint()

    expect(result).toBeNull()
    expect(storage.removeItem).toHaveBeenCalledWith("auth_identity_hint")
  })

  it("clearStoredAuthIdentityHint removes hint from memory and sessionStorage", () => {
    persistAuthIdentityHint({ organizationSlug: "seuze", apartment: "101", block: 1 })
    clearStoredAuthIdentityHint()

    expect(readStoredAuthIdentityHint()).toBeNull()
    expect(storage.getItem("auth_identity_hint")).toBeNull()
  })
})
