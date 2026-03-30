import { describe, expect, it } from "vitest"
import { shouldRetryProfileWithBearer, normalizeProfileApiError } from "./auth-profile-bootstrap"

describe("shouldRetryProfileWithBearer", () => {
  it("retries when API returns 401 TOKEN_NOT_PROVIDED code", () => {
    const error = Object.assign(new Error("Token not provided"), {
      status: 401,
      code: "TOKEN_NOT_PROVIDED",
    })

    expect(shouldRetryProfileWithBearer(error)).toBe(true)
  })

  it("retries when API returns 401 and token-not-provided message", () => {
    const error = Object.assign(new Error("Token not provided"), {
      status: 401,
    })

    expect(shouldRetryProfileWithBearer(error)).toBe(true)
  })

  it("does not retry for non-401 errors", () => {
    const error = Object.assign(new Error("Internal server error"), {
      status: 500,
      code: "INTERNAL_ERROR",
    })

    expect(shouldRetryProfileWithBearer(error)).toBe(false)
  })

  it("does not retry for 401 errors with unrelated messages", () => {
    const error = Object.assign(new Error("Unauthorized"), {
      status: 401,
      code: "UNAUTHORIZED",
    })

    expect(shouldRetryProfileWithBearer(error)).toBe(false)
  })

  it("returns false for non-object errors", () => {
    expect(shouldRetryProfileWithBearer("string error")).toBe(false)
    expect(shouldRetryProfileWithBearer(null)).toBe(false)
    expect(shouldRetryProfileWithBearer(undefined)).toBe(false)
  })
})

describe("normalizeProfileApiError", () => {
  it("uses API-provided code when present", async () => {
    const res = new Response(JSON.stringify({ message: "Token not provided", code: "TOKEN_NOT_PROVIDED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(401)
    expect(normalized.code).toBe("TOKEN_NOT_PROVIDED")
    expect(normalized.message).toBe("Token not provided")
  })

  it("infers TOKEN_NOT_PROVIDED when message matches and no code is present", async () => {
    const res = new Response(JSON.stringify({ message: "Token not provided" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(401)
    expect(normalized.code).toBe("TOKEN_NOT_PROVIDED")
  })

  it("uses fallback message when body is not JSON", async () => {
    const res = new Response("not json", {
      status: 500,
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(500)
    expect(normalized.message).toBe("Failed to fetch user profile")
    expect(normalized.code).toBeUndefined()
  })

  it("preserves HTTP status from response", async () => {
    const res = new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(403)
    expect(normalized.message).toBe("Forbidden")
  })
})
