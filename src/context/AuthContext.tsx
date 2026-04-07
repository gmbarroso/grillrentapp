"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useUserProfile } from "../hooks/user/useUserProfile"
import { useLoginUser } from "../hooks/user/useLoginUser"
import { useLogoutUser } from "../hooks/user/useLogoutUser"
import { useLoading } from "../context/LoadingContext"
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearRuntimeBearerToken,
  resetUnauthorizedSignal,
  setRuntimeBearerToken,
} from "../utils/api"
import {
  clearStoredAccessToken,
  clearStoredAuthIdentityHint,
  persistAuthIdentityHint,
  persistAccessToken,
  readStoredAccessToken,
  stripAccessTokenFromUrl,
} from "../utils/auth-storage"
import { clearStoredCsrfToken } from "../utils/csrf"
import { authDebug, authError } from "../utils/auth-logger"
import { shouldRetryProfileWithBearer } from "../utils/auth-profile-bootstrap"
import type { OnboardingFlags, TourState, User } from "../types"

interface AuthContextType {
  isAuthenticated: boolean
  isAuthResolved: boolean
  user: User | null
  onboarding: OnboardingFlags
  tour: TourState
  token: string | null
  login: (
    organizationSlug: string,
    apartment: string,
    block: number,
    password: string,
  ) => Promise<{ success: boolean; errorCode?: string; errorMessage?: string }>
  logout: () => Promise<void>
  deleteUser: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const COOKIE_SESSION_TOKEN = "cookie-session"
const PROFILE_BEARER_FALLBACK_ENABLED = (process.env.REACT_APP_AUTH_PROFILE_BEARER_FALLBACK ?? "true").toLowerCase() !== "false"
const defaultOnboardingState: OnboardingFlags = {
  mustProvideEmail: false,
  mustVerifyEmail: false,
  mustChangePassword: false,
  onboardingRequired: false,
}
const defaultTourState: TourState = {
  firstAccessTourVersionCompleted: null,
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthResolved, setIsAuthResolved] = useState(false)
  const [token, setToken] = useState<string | null>(COOKIE_SESSION_TOKEN)

  const { data: userResponse, error: userError, isLoading: isUserLoading, fetchProfile } = useUserProfile(token)
  const { login: loginMutate, isLoading: isLoginLoading } = useLoginUser()
  const { logout: logoutMutate, isLoading: isLogoutLoading } = useLogoutUser()
  const { setIsLoading } = useLoading()

  const authResetInProgressRef = useRef(false)
  const loginInFlightRef = useRef(false)

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") return
    if (window.location.pathname !== "/login") {
      window.location.replace("/login")
    }
  }, [])

  const clearAuthState = useCallback(() => {
    clearRuntimeBearerToken()
    clearStoredAccessToken()
    clearStoredCsrfToken()
    clearStoredAuthIdentityHint()
    setIsAuthenticated(false)
    setToken(null)
  }, [])

  const handleUnauthorized = useCallback(() => {
    if (authResetInProgressRef.current) return

    authResetInProgressRef.current = true
    clearAuthState()
    setIsAuthResolved(true)
    setIsLoading(false)
    redirectToLogin()
  }, [clearAuthState, redirectToLogin, setIsLoading])

  useEffect(() => {
    if (stripAccessTokenFromUrl()) {
      authDebug("[Auth] Removed token-like params from URL before auth bootstrap")
    }
    const persistedAccessToken = readStoredAccessToken()
    setRuntimeBearerToken(persistedAccessToken)

    authResetInProgressRef.current = false
    resetUnauthorizedSignal()
    setToken(COOKIE_SESSION_TOKEN)
    setIsAuthResolved(false)
  }, [clearAuthState, redirectToLogin])

  useEffect(() => {
    if (isUserLoading) return

    if (userResponse?.user && !userError) {
      authResetInProgressRef.current = false
      setToken(COOKIE_SESSION_TOKEN)
      setIsAuthenticated(true)
      setIsAuthResolved(true)
      return
    }

    if (!isUserLoading && userError) {
      if (loginInFlightRef.current) return
      if (window.location.pathname !== "/login") {
        handleUnauthorized()
      }
      setIsAuthResolved(true)
      return
    }

    if (!isUserLoading) {
      setIsAuthenticated(false)
      setToken(null)
      setIsAuthResolved(true)
    }
  }, [handleUnauthorized, isUserLoading, userError, userResponse?.user])

  useEffect(() => {
    const onUnauthorized = () => {
      if (loginInFlightRef.current) return
      handleUnauthorized()
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    setIsLoading(isUserLoading || isLoginLoading || isLogoutLoading)
  }, [isUserLoading, isLoginLoading, isLogoutLoading, setIsLoading])

  const login = async (
    organizationSlug: string,
    apartment: string,
    block: number,
    password: string,
  ): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> => {
    try {
      loginInFlightRef.current = true
      setIsAuthResolved(false)
      setIsAuthenticated(false)
      clearRuntimeBearerToken()
      clearStoredAccessToken()
      clearStoredCsrfToken()
      clearStoredAuthIdentityHint()
      const loginResult = await loginMutate({ organizationSlug, apartment, block, password })
      if (typeof loginResult?.access_token === "string" && loginResult.access_token.length > 0) {
        persistAccessToken(loginResult.access_token)
        setRuntimeBearerToken(loginResult.access_token)
      }
      resetUnauthorizedSignal()
      authResetInProgressRef.current = false
      let profileResponse: Awaited<ReturnType<typeof fetchProfile>>
      try {
        profileResponse = await fetchProfile()
      } catch (error) {
        const canRetryWithBearer =
          PROFILE_BEARER_FALLBACK_ENABLED
          && shouldRetryProfileWithBearer(error)
          && typeof loginResult?.access_token === "string"
          && loginResult.access_token.length > 0
        if (!canRetryWithBearer) {
          throw error
        }
        authDebug("[Auth] Retrying profile bootstrap with bearer fallback")
        setRuntimeBearerToken(loginResult.access_token)
        profileResponse = await fetchProfile({ bearerToken: loginResult.access_token })
      }
      if (!profileResponse?.user) {
        throw new Error("Não foi possível confirmar a sessão autenticada")
      }
      persistAuthIdentityHint({ organizationSlug, apartment, block })
      setToken(COOKIE_SESSION_TOKEN)
      setIsAuthenticated(true)
      setIsAuthResolved(true)
      loginInFlightRef.current = false
      return { success: true }
    } catch (error) {
      authError("[Auth] Login error:", error)
      clearRuntimeBearerToken()
      clearStoredAccessToken()
      clearStoredCsrfToken()
      clearStoredAuthIdentityHint()
      setIsAuthenticated(false)
      setToken(null)
      setIsAuthResolved(true)
      loginInFlightRef.current = false
      const errorCode = typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : undefined
      return {
        success: false,
        errorCode,
        errorMessage: error instanceof Error ? error.message : "Falha no login",
      }
    }
  }

  const logout = useCallback(async () => {
    authResetInProgressRef.current = true
    clearAuthState()
    setIsAuthResolved(true)

    try {
      await logoutMutate()
    } catch (error) {
      authError("[Auth] Error during logout:", error)
    } finally {
      redirectToLogin()
    }
  }, [clearAuthState, logoutMutate, redirectToLogin])

  const handleDeleteUser = useCallback(async () => {
    return
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!token) return
    await fetchProfile()
  }, [fetchProfile, token])

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isAuthResolved,
      user: userError ? null : (userResponse?.user ?? null),
      onboarding: userError
        ? defaultOnboardingState
        : {
            mustProvideEmail: Boolean(userResponse?.mustProvideEmail ?? userResponse?.onboarding?.mustProvideEmail),
            mustVerifyEmail: Boolean(userResponse?.mustVerifyEmail ?? userResponse?.onboarding?.mustVerifyEmail),
            mustChangePassword: Boolean(userResponse?.mustChangePassword ?? userResponse?.onboarding?.mustChangePassword),
            onboardingRequired: Boolean(userResponse?.onboardingRequired ?? userResponse?.onboarding?.onboardingRequired),
          },
      tour: userError
        ? defaultTourState
        : {
            firstAccessTourVersionCompleted: userResponse?.tour?.firstAccessTourVersionCompleted ?? null,
          },
      token,
      login,
      logout,
      deleteUser: handleDeleteUser,
      refreshProfile,
    }),
    [
      isAuthenticated,
      isAuthResolved,
      userError,
      userResponse?.mustChangePassword,
      userResponse?.mustProvideEmail,
      userResponse?.mustVerifyEmail,
      userResponse?.tour?.firstAccessTourVersionCompleted,
      userResponse?.onboarding?.mustChangePassword,
      userResponse?.onboarding?.mustProvideEmail,
      userResponse?.onboarding?.mustVerifyEmail,
      userResponse?.onboarding?.onboardingRequired,
      userResponse?.onboardingRequired,
      userResponse?.user,
      token,
      logout,
      handleDeleteUser,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
