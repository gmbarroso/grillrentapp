import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearStoredCsrfToken, isStateChangingMethod, persistCsrfToken, readCsrfToken } from "./csrf"

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
  }
}

describe("csrf utils", () => {
  let storage: ReturnType<typeof createLocalStorage>

  beforeEach(() => {
    storage = createLocalStorage()
    vi.stubGlobal("document", { cookie: "" })
    vi.stubGlobal("window", { localStorage: storage })
    vi.stubGlobal("localStorage", storage)
    clearStoredCsrfToken()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("identifies state-changing methods", () => {
    expect(isStateChangingMethod("POST")).toBe(true)
    expect(isStateChangingMethod("PUT")).toBe(true)
    expect(isStateChangingMethod("PATCH")).toBe(true)
    expect(isStateChangingMethod("DELETE")).toBe(true)
    expect(isStateChangingMethod("GET")).toBe(false)
  })

  it("reads csrf token from cookie", () => {
    ;(document as any).cookie = "foo=1; grillrent_csrf=csrf-token-123; bar=2"
    expect(readCsrfToken()).toBe("csrf-token-123")
  })

  it("falls back to stored csrf token when cookie is not readable", () => {
    persistCsrfToken("csrf-from-login-response")
    expect(readCsrfToken()).toBe("csrf-from-login-response")
  })

  it("clears stored csrf token", () => {
    persistCsrfToken("csrf-from-login-response")
    clearStoredCsrfToken()
    expect(readCsrfToken()).toBeNull()
  })
})
