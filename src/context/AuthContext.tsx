"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useUserProfile } from "../hooks/user/useUserProfile"
import { useLoginUser } from "../hooks/user/useLoginUser"
import { useLogoutUser } from "../hooks/user/useLogoutUser"
import { useLoading } from "../context/LoadingContext"
import { isTokenExpired, isValidToken } from "../utils/jwt"
import {
  AUTH_UNAUTHORIZED_EVENT,
  resetUnauthorizedSignal,
} from "../utils/api"
import {
  readStoredAccessToken,
  persistAccessToken,
  clearStoredAccessToken,
  stripAccessTokenFromUrl,
} from "../utils/auth-storage"
import { authDebug, authError } from "../utils/auth-logger"
import type { User } from "../types/User"

interface AuthContextType {
  isAuthenticated: boolean
  isAuthResolved: boolean
  user: User | null
  token: string | null
  login: (apartment: string, block: number, password: string) => Promise<boolean>
  logout: () => Promise<void>
  deleteUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthResolved, setIsAuthResolved] = useState(false)
  const [token, setToken] = useState<string | null>(null)

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

    const storedToken = readStoredAccessToken()

    if (!storedToken || !isValidToken(storedToken) || isTokenExpired(storedToken)) {
      authResetInProgressRef.current = true
      clearAuthState()
      setIsAuthResolved(true)
      redirectToLogin()
      return
    }

    authResetInProgressRef.current = false
    resetUnauthorizedSignal()
    setToken(storedToken)
    setIsAuthenticated(true)
    setIsAuthResolved(true)
  }, [clearAuthState, redirectToLogin])

  useEffect(() => {
    if (!token) return

    const checkInterval = setInterval(() => {
      if (isTokenExpired(token)) {
        handleUnauthorized()
      }
    }, 60000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [token, handleUnauthorized])

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

  const login = async (apartment: string, block: number, password: string): Promise<boolean> => {
    try {
      const response = await loginMutate({ apartment, block, password })

      if (!response) {
        return false
      }

      const newToken = response.access_token || response.data?.access_token

      if (!newToken || !isValidToken(newToken) || isTokenExpired(newToken)) {
        return false
      }

      persistAccessToken(newToken)
      resetUnauthorizedSignal()
      authResetInProgressRef.current = false
      setToken(newToken)
      setIsAuthenticated(true)
      setIsAuthResolved(true)
      return true
    } catch (error) {
      authError("[Auth] Login error:", error)
      return false
    }
  }

  const logout = useCallback(async () => {
    const tokenToRevoke = token || readStoredAccessToken()

    authResetInProgressRef.current = true
    clearAuthState()
    setIsAuthResolved(true)

    try {
      if (tokenToRevoke) {
        await logoutMutate(tokenToRevoke)
      }
    } catch (error) {
      authError("[Auth] Error during logout:", error)
    } finally {
      redirectToLogin()
    }
  }, [clearAuthState, logoutMutate, redirectToLogin, token])

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
