import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearRuntimeBearerToken, fetchWithAuthHandling, setRuntimeBearerToken } from "./api"

describe("fetchWithAuthHandling runtime bearer fallback", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearRuntimeBearerToken()
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
})
