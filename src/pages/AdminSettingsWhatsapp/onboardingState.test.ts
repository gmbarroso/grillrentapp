import { describe, expect, it } from "vitest"
import { isQrExpired, parseOnboardingState, parseQrSeconds, resolveSettingsStage } from "./onboardingState"

describe("Admin WhatsApp onboarding frontend state flow", () => {
  it("happy path: resolves connected settings with binding to active", () => {
    expect(resolveSettingsStage("connected", "120363000000000000@g.us")).toBe("active")
    expect(parseOnboardingState({ state: "active" })).toBe("active")
  })

  it("qr expired: treats zero countdown as expired and keeps qr stage recoverable", () => {
    expect(isQrExpired(0)).toBe(true)
    expect(parseOnboardingState({ state: "qr_ready" })).toBe("qr_ready")
  })

  it("provider timeout fallback: qr ttl falls back to default when provider omits ttl", () => {
    expect(parseQrSeconds({ ttlSeconds: 0 })).toBe(59)
  })

  it("no groups path: connected settings without binding enters group selection", () => {
    expect(resolveSettingsStage("connected", null)).toBe("group_selection")
  })

  it("disconnect path: disconnected settings returns to idle", () => {
    expect(resolveSettingsStage("disconnected", null)).toBe("idle")
  })
})
