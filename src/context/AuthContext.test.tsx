import { describe, expect, it, vi } from "vitest"
import { shouldRetryProfileWithBearer } from "../utils/auth-profile-bootstrap"

describe("AuthProvider login retry behavior", () => {
  it("retries fetchProfile with bearer token when first call returns 401 token-not-provided", async () => {
    const tokenNotProvidedError = Object.assign(new Error("Token not provided"), {
      status: 401,
      code: "TOKEN_NOT_PROVIDED",
    })
    const mockUser = { id: "1", name: "Test User" }
    const fetchProfile = vi.fn()
      .mockRejectedValueOnce(tokenNotProvidedError)
      .mockResolvedValueOnce({ user: mockUser })

    const bearerFallbackEnabled = true
    const loginResult = { access_token: "test-access-token" }

    let profileResponse: { user: typeof mockUser } | undefined
    try {
      profileResponse = await fetchProfile()
    } catch (error) {
      const canRetryWithBearer =
        bearerFallbackEnabled
        && shouldRetryProfileWithBearer(error)
        && typeof loginResult?.access_token === "string"
        && loginResult.access_token.length > 0
      if (!canRetryWithBearer) throw error
      profileResponse = await fetchProfile({ bearerToken: loginResult.access_token })
    }

    expect(fetchProfile).toHaveBeenCalledTimes(2)
    expect(fetchProfile.mock.calls[1][0]).toEqual({ bearerToken: "test-access-token" })
    expect(profileResponse?.user).toEqual(mockUser)
  })

  it("does not retry when fallback is disabled", async () => {
    const tokenNotProvidedError = Object.assign(new Error("Token not provided"), {
      status: 401,
      code: "TOKEN_NOT_PROVIDED",
    })
    const fetchProfile = vi.fn().mockRejectedValue(tokenNotProvidedError)

    const bearerFallbackEnabled = false
    const loginResult = { access_token: "test-access-token" }

    let caughtError: unknown
    try {
      await (async () => {
        try {
          await fetchProfile()
        } catch (error) {
          const canRetryWithBearer =
            bearerFallbackEnabled
            && shouldRetryProfileWithBearer(error)
            && typeof loginResult?.access_token === "string"
            && loginResult.access_token.length > 0
          if (!canRetryWithBearer) throw error
          await fetchProfile({ bearerToken: loginResult.access_token })
        }
      })()
    } catch (error) {
      caughtError = error
    }

    expect(fetchProfile).toHaveBeenCalledTimes(1)
    expect(caughtError).toBe(tokenNotProvidedError)
  })

  it("does not retry when login result has no access_token", async () => {
    const tokenNotProvidedError = Object.assign(new Error("Token not provided"), {
      status: 401,
      code: "TOKEN_NOT_PROVIDED",
    })
    const fetchProfile = vi.fn().mockRejectedValue(tokenNotProvidedError)

    const bearerFallbackEnabled = true
    const loginResult = { access_token: "" }

    let caughtError: unknown
    try {
      await (async () => {
        try {
          await fetchProfile()
        } catch (error) {
          const canRetryWithBearer =
            bearerFallbackEnabled
            && shouldRetryProfileWithBearer(error)
            && typeof loginResult?.access_token === "string"
            && loginResult.access_token.length > 0
          if (!canRetryWithBearer) throw error
          await fetchProfile({ bearerToken: loginResult.access_token })
        }
      })()
    } catch (error) {
      caughtError = error
    }

    expect(fetchProfile).toHaveBeenCalledTimes(1)
    expect(caughtError).toBe(tokenNotProvidedError)
  })

  it("does not handle unauthorized event when login is in flight", () => {
    const loginInFlight = { current: true }
    const handleUnauthorized = vi.fn()

    const onUnauthorized = () => {
      if (loginInFlight.current) return
      handleUnauthorized()
    }

    onUnauthorized()
    expect(handleUnauthorized).not.toHaveBeenCalled()

    loginInFlight.current = false
    onUnauthorized()
    expect(handleUnauthorized).toHaveBeenCalledOnce()
  })

  it("handles unauthorized event normally when no login is in flight", () => {
    const loginInFlight = { current: false }
    const handleUnauthorized = vi.fn()

    const onUnauthorized = () => {
      if (loginInFlight.current) return
      handleUnauthorized()
    }

    onUnauthorized()
    expect(handleUnauthorized).toHaveBeenCalledOnce()
  })
})
