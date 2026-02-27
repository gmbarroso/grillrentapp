import { describe, expect, it } from "vitest"
import { sanitizeForLog, stripSensitiveQueryParams } from "./auth-logger"

describe("auth logger sanitization", () => {
  it("redacts sensitive keys recursively", () => {
    const input = {
      password: "secret",
      profile: {
        token: "abc",
        name: "User",
      },
      list: [{ authorization: "Bearer xyz" }, { safe: true }],
    }

    expect(sanitizeForLog(input)).toEqual({
      password: "[REDACTED]",
      profile: {
        token: "[REDACTED]",
        name: "User",
      },
      list: [{ authorization: "[REDACTED]" }, { safe: true }],
    })
  })

  it("redacts sensitive query params in endpoints", () => {
    expect(stripSensitiveQueryParams("/users/profile?tab=1&access_token=abc&token=xyz")).toBe(
      "/users/profile?tab=1&access_token=%5BREDACTED%5D&token=%5BREDACTED%5D",
    )
  })
})
