import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearStoredAccessToken, persistAccessToken, readStoredAccessToken } from "./auth-storage"

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

  beforeEach(() => {
    storage = createLocalStorage()
    vi.stubGlobal("window", { localStorage: storage })
    vi.stubGlobal("localStorage", storage)
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
    expect(storage.getItem("token")).toBe("new-token")
  })
})
