import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearRuntimeBearerToken, fetchWithAuthHandling, setRuntimeBearerToken } from "./api"
import { clearStoredAccessToken, clearStoredAuthIdentityHint, persistAccessToken, persistAuthIdentityHint } from "./auth-storage"

describe("fetchWithAuthHandling runtime bearer fallback", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearRuntimeBearerToken()
    clearStoredAccessToken()
    clearStoredAuthIdentityHint()
    fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true, headers: Object.fromEntries(new Headers(init?.headers).entries()) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    })
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    clearRuntimeBearerToken()
    clearStoredAccessToken()
    clearStoredAuthIdentityHint()
    vi.unstubAllGlobals()
  })

  it("attaches runtime bearer token when request has no Authorization header", async () => {
    setRuntimeBearerToken("runtime-token")

    await fetchWithAuthHandling("https://example.com/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBe("Bearer runtime-token")
  })

  it("does not override explicit Authorization header", async () => {
    setRuntimeBearerToken("runtime-token")

    await fetchWithAuthHandling("https://example.com/protected", {
      headers: { Authorization: "Bearer explicit-token" },
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBe("Bearer explicit-token")
  })

  it("stops attaching Authorization after runtime token is cleared", async () => {
    setRuntimeBearerToken("runtime-token")
    clearRuntimeBearerToken()

    await fetchWithAuthHandling("https://example.com/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBeNull()
  })

  it("attaches stored access token when runtime token is absent", async () => {
    persistAccessToken("persisted-token")

    await fetchWithAuthHandling("https://example.com/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBe("Bearer persisted-token")
  })

  it("prefers runtime token over stored access token", async () => {
    persistAccessToken("persisted-token")
    setRuntimeBearerToken("runtime-token")

    await fetchWithAuthHandling("https://example.com/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBe("Bearer runtime-token")
  })

  it("stops attaching Authorization after stored token is cleared", async () => {
    persistAccessToken("persisted-token")
    clearStoredAccessToken()

    await fetchWithAuthHandling("https://example.com/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("Authorization")).toBeNull()
  })

  it("attaches apartment identity hints when available", async () => {
    persistAuthIdentityHint({ organizationSlug: "seuze", apartment: "1201", block: 1 })

    await fetchWithAuthHandling("https://example.com/protected")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get("X-Organization-Slug-Hint")).toBe("seuze")
    expect(headers.get("X-User-Apartment-Hint")).toBe("1201")
    expect(headers.get("X-User-Block-Hint")).toBe("1")
  })
})
