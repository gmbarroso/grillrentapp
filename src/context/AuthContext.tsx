"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useUserProfile } from "../hooks/user/useUserProfile"
import { useLoginUser } from "../hooks/user/useLoginUser"
import { useLogoutUser } from "../hooks/user/useLogoutUser"
import { useLoading } from "../context/LoadingContext"
import {
  AUTH_UNAUTHORIZED_EVENT,
  resetUnauthorizedSignal,
} from "../utils/api"
import {
  clearStoredAccessToken,
  stripAccessTokenFromUrl,
} from "../utils/auth-storage"
import { clearStoredCsrfToken } from "../utils/csrf"
import { authDebug, authError } from "../utils/auth-logger"
import type { User } from "../types/User"

interface AuthContextType {
  isAuthenticated: boolean
  isAuthResolved: boolean
  user: User | null
  token: string | null
  login: (
    organizationSlug: string,
    apartment: string,
    block: number,
    password: string,
  ) => Promise<{ success: boolean; errorCode?: string; errorMessage?: string }>
  logout: () => Promise<void>
  deleteUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const COOKIE_SESSION_TOKEN = "cookie-session"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthResolved, setIsAuthResolved] = useState(false)
  const [token, setToken] = useState<string | null>(COOKIE_SESSION_TOKEN)

  const { data: userResponse, error: userError, isLoading: isUserLoading } = useUserProfile(token)
  const { login: loginMutate, isLoading: isLoginLoading } = useLoginUser()
  const { logout: logoutMutate, isLoading: isLogoutLoading } = useLogoutUser()
  const { setIsLoading } = useLoading()

  const authResetInProgressRef = useRef(false)

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") return
    if (window.location.pathname !== "/login") {
      window.location.replace("/login")
    }
  }, [])

  const clearAuthState = useCallback(() => {
    clearStoredAccessToken()
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
    clearStoredAccessToken()

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
      await loginMutate({ organizationSlug, apartment, block, password })
      resetUnauthorizedSignal()
      authResetInProgressRef.current = false
      setToken(COOKIE_SESSION_TOKEN)
      setIsAuthenticated(true)
      setIsAuthResolved(true)
      return { success: true }
    } catch (error) {
      authError("[Auth] Login error:", error)
      const errorCode = typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : undefined
      return {
        success: false,
        errorCode,
        errorMessage: error instanceof Error ? error.message : "Login failed",
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

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isAuthResolved,
      user: userError ? null : (userResponse?.user ?? null),
      token,
      login,
      logout,
      deleteUser: handleDeleteUser,
    }),
    [isAuthenticated, isAuthResolved, userError, userResponse?.user, token, logout, handleDeleteUser],
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
