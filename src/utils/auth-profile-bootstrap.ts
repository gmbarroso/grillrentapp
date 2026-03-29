export type AuthApiError = Error & { status?: number; code?: string }

export const shouldRetryProfileWithBearer = (error: unknown): boolean => {
  const candidate = error as AuthApiError
  if (!candidate || typeof candidate !== "object") return false

  const status = typeof candidate.status === "number" ? candidate.status : undefined
  const code = typeof candidate.code === "string" ? candidate.code.toUpperCase() : ""
  const message = candidate instanceof Error ? candidate.message.toLowerCase() : ""
  return status === 401 && (code === "TOKEN_NOT_PROVIDED" || message.includes("token not provided"))
}

export const normalizeProfileApiError = async (res: Response): Promise<AuthApiError> => {
  let message = "Failed to fetch user profile"
  let code: string | undefined

  try {
    const body = await res.clone().json()
    if (typeof body?.message === "string" && body.message.trim()) {
      message = body.message
    }
    if (typeof body?.code === "string" && body.code.trim()) {
      code = body.code.trim()
    }
  } catch {
    // ignore json parse failures
  }

  const profileError = new Error(message) as AuthApiError
  profileError.status = res.status
  if (code) {
    profileError.code = code
  } else if (/token not provided/i.test(message)) {
    profileError.code = "TOKEN_NOT_PROVIDED"
  }
  return profileError
}
