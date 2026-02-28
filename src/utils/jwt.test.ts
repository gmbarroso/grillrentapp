import { describe, expect, it, vi, afterEach } from "vitest"
import { isTokenExpired, isValidToken } from "./jwt"

const buildToken = (payload: Record<string, unknown>) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${header}.${body}.signature`
}

afterEach(() => {
  vi.useRealTimers()
})

describe("jwt utils", () => {
  it("treats malformed token as expired", () => {
    expect(isTokenExpired("bad-token")).toBe(true)
  })

  it("treats malformed token as invalid", () => {
    expect(isValidToken("bad-token")).toBe(false)
  })

  it("returns true when exp is in the past", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-02-27T12:00:00.000Z"))

    const token = buildToken({ exp: 1700000000 })
    expect(isTokenExpired(token)).toBe(true)
  })

  it("returns false when exp is in the future", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-02-27T12:00:00.000Z"))

    const token = buildToken({ exp: 1900000000 })
    expect(isTokenExpired(token)).toBe(false)
  })

  it("treats token with missing exp as expired", () => {
    const token = buildToken({ role: "resident" })
    expect(isTokenExpired(token)).toBe(true)
  })

  it("treats token with non-numeric exp as expired", () => {
    const token = buildToken({ exp: "1900000000" })
    expect(isTokenExpired(token)).toBe(true)
  })
})
