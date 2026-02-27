import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isStateChangingMethod, readCsrfToken } from "./csrf"

describe("csrf utils", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "" })
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
})
