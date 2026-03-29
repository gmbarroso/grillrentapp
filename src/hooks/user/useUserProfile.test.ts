import { describe, expect, it } from "vitest"
import { normalizeProfileApiError } from "../../utils/auth-profile-bootstrap"

describe("useUserProfile API error normalization", () => {
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

  it("infers TOKEN_NOT_PROVIDED when message matches", async () => {
    const res = new Response(JSON.stringify({ message: "Token not provided" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(401)
    expect(normalized.code).toBe("TOKEN_NOT_PROVIDED")
  })
})
