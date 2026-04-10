export type OnboardingStage = "bootstrapping" | "idle" | "creating_instance" | "qr_ready" | "connecting" | "group_selection" | "active" | "failed"

interface OnboardingSnapshot {
  state?: string
  status?: string
  expiresInSeconds?: number
  ttlSeconds?: number
  qrExpiresInSeconds?: number
}

export const FALLBACK_QR_SECONDS = 59

export const parseOnboardingState = (payload?: Partial<OnboardingSnapshot> | null): OnboardingStage | null => {
  const raw = `${payload?.state || payload?.status || ""}`.trim().toLowerCase()
  if (!raw) return null
  if (raw === "active") return "active"
  if (raw === "group_selection") return "group_selection"
  if (["connected", "open"].includes(raw)) return "group_selection"
  if (["connecting", "opening"].includes(raw)) return "connecting"
  if (["qr", "qr_ready", "qrcode", "awaiting_qr", "awaiting_scan"].includes(raw)) return "qr_ready"
  if (["creating", "creating_instance", "starting"].includes(raw)) return "creating_instance"
  if (["failed", "error", "disconnected", "closed"].includes(raw)) return "failed"
  return null
}

export const parseQrSeconds = (payload?: Partial<OnboardingSnapshot> | null): number => {
  const possible = [payload?.expiresInSeconds, payload?.ttlSeconds, payload?.qrExpiresInSeconds]
  const parsed = possible
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0)
  return parsed ? Math.floor(parsed) : FALLBACK_QR_SECONDS
}

export const resolveSettingsStage = (status: "connected" | "disconnected", noticeGroupJid?: string | null): OnboardingStage => {
  if (status !== "connected") return "idle"
  return noticeGroupJid ? "active" : "group_selection"
}

export const isQrExpired = (secondsLeft: number): boolean => secondsLeft <= 0
