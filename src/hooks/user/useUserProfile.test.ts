import { describe, expect, it } from "vitest"
import { normalizeProfileApiError } from "../../utils/auth-profile-bootstrap"

// These tests verify that normalizeProfileApiError produces errors that
// useUserProfile can throw and that callers (e.g., AuthContext) can inspect.
// Full hook-level tests require a DOM environment (jsdom/happy-dom) and
// @testing-library/react to render the hook.
describe("useUserProfile – normalized error shape", () => {
  it("produces an error with status and code for 401 TOKEN_NOT_PROVIDED responses", async () => {
    const res = new Response(JSON.stringify({ message: "Token not provided", code: "TOKEN_NOT_PROVIDED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(401)
    expect(normalized.code).toBe("TOKEN_NOT_PROVIDED")
    expect(normalized.message).toBe("Token not provided")
  })

  it("infers TOKEN_NOT_PROVIDED code when message matches and no explicit code is present", async () => {
    const res = new Response(JSON.stringify({ message: "Token not provided" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })

    const normalized = await normalizeProfileApiError(res)

    expect(normalized.status).toBe(401)
    expect(normalized.code).toBe("TOKEN_NOT_PROVIDED")
  })
})
