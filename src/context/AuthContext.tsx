"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useUserProfile } from "../hooks/user/useUserProfile"
import { useLoginUser } from "../hooks/user/useLoginUser"
import { useLogoutUser } from "../hooks/user/useLogoutUser"
import { useLoading } from "../context/LoadingContext"
import { isTokenExpired } from "../utils/jwt"
import type { User } from "../types/User"

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (apartment: string, block: number, password: string) => Promise<boolean>
  logout: () => void
  deleteUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add render counter for debugging
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[AuthProvider] Render count: ${renderCount.current}`)

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null)
  const { data: userResponse, error: userError, isLoading: isUserLoading } = useUserProfile(token)
  const { error: loginError, login: loginMutate, isLoading: isLoginLoading } = useLoginUser()
  const { logout: logoutMutate, isLoading: isLogoutLoading } = useLogoutUser()
  const { setIsLoading } = useLoading()

  // Add a ref to track if we're in the login process to prevent excessive re-renders
  const isLoggingIn = useRef(false)

  useEffect(() => {
    console.log("[AuthProvider] Initial token check effect running")
    const storedToken = localStorage.getItem("token")
    if (storedToken && !isTokenExpired(storedToken)) {
      console.log("[AuthProvider] Valid token found in localStorage")
      setIsAuthenticated(true)
      setToken(storedToken)
    } else if (storedToken) {
      console.log("[AuthProvider] Expired token found in localStorage")
      handleLogout()
    }
  }, [])

  useEffect(() => {
    console.log("[AuthProvider] Token expiration check effect setup")
    if (!token) return

    const checkInterval = setInterval(() => {
      console.log("[AuthProvider] Running periodic token check")
      if (isTokenExpired(token)) {
        console.log("[AuthProvider] Token expired during periodic check")
        handleLogout()
      }
    }, 60000)

    return () => {
      console.log("[AuthProvider] Clearing token check interval")
      clearInterval(checkInterval)
    }
  }, [token])

  useEffect(() => {
    console.log("[AuthProvider] Loading state effect running", { isUserLoading, isLoginLoading, isLogoutLoading })
    setIsLoading(isUserLoading || isLoginLoading || isLogoutLoading)
  }, [isUserLoading, isLoginLoading, isLogoutLoading, setIsLoading])

  const login = async (apartment: string, block: number, password: string): Promise<boolean> => {
    console.log("[AuthProvider] Login attempt", { apartment, block })

    isLoggingIn.current = true

    try {
      const response = await loginMutate({ apartment, block, password })
      console.log("[AuthProvider] Login response:", response)

      if (response && "access_token" in response) {
        const newToken = response.access_token as string
        console.log("[AuthProvider] Login successful, token received")

        localStorage.setItem("token", newToken)

        setToken(newToken)
        setIsAuthenticated(true)

        isLoggingIn.current = false
        return true
      } else {
        console.error("Login failed:", loginError)
        isLoggingIn.current = false
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      isLoggingIn.current = false
      return false
    }
  }

  const handleLogout = useCallback(async () => {
    console.log("[AuthProvider] Logout initiated")
    setIsLoading(true)
    try {
      if (token) {
        await logoutMutate(token)
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      localStorage.removeItem("token")
      setIsAuthenticated(false)
      setToken(null)
      setIsLoading(false)
      console.log("[AuthProvider] Logout completed")
    }
  }, [token, logoutMutate, setIsLoading])

  const handleDeleteUser = useCallback(async () => {
    console.log("[AuthProvider] Delete user called (not implemented)")
    return
  }, [])

  const contextValue = useMemo(() => {
    if (isLoggingIn.current) {
      console.log("[AuthProvider] Skipping context recalculation during login")
      return {
        isAuthenticated,
        user: userError ? null : (userResponse?.user ?? null),
        token,
        login,
        logout: handleLogout,
        deleteUser: handleDeleteUser,
      }
    }

    console.log("[AuthProvider] Context value recalculated")
    return {
      isAuthenticated,
      user: userError ? null : (userResponse?.user ?? null),
      token,
      login,
      logout: handleLogout,
      deleteUser: handleDeleteUser,
    }
  }, [isAuthenticated, userError, userResponse?.user, token, handleLogout, handleDeleteUser])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

