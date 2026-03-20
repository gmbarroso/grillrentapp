type ConsoleLevelName = "none" | "error" | "warn" | "info" | "debug"

const LEVEL_WEIGHT: Record<ConsoleLevelName, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
}

const METHOD_LEVEL: Record<"error" | "warn" | "info" | "log" | "debug" | "trace", number> = {
  error: LEVEL_WEIGHT.error,
  warn: LEVEL_WEIGHT.warn,
  info: LEVEL_WEIGHT.info,
  log: LEVEL_WEIGHT.info,
  debug: LEVEL_WEIGHT.debug,
  trace: LEVEL_WEIGHT.debug,
}

const readConsoleLevel = (): ConsoleLevelName => {
  const raw = (import.meta.env.VITE_CONSOLE_LEVEL ?? "").toString().trim().toLowerCase()
  if (raw === "none" || raw === "error" || raw === "warn" || raw === "info" || raw === "debug") {
    return raw
  }

  // Keep development visibility while avoiding noisy logs in production.
  return import.meta.env.DEV ? "warn" : "none"
}

export const configureConsoleLevel = (): void => {
  const level = readConsoleLevel()
  const allowedWeight = LEVEL_WEIGHT[level]
  const noop = () => {}
  const methods: Array<keyof typeof METHOD_LEVEL> = ["error", "warn", "info", "log", "debug", "trace"]

  methods.forEach((method) => {
    if (METHOD_LEVEL[method] > allowedWeight) {
      console[method] = noop
    }
  })
}
