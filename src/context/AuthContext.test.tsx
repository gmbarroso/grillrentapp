import { describe, expect, it } from "vitest"
import { shouldRetryProfileWithBearer } from "../utils/auth-profile-bootstrap"

describe("AuthContext profile bootstrap fallback", () => {
  it("retries when API returns 401 TOKEN_NOT_PROVIDED", () => {
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
})
