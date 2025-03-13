"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null)
  const { data: userResponse, error: userError, isLoading: isUserLoading } = useUserProfile(token)
  const { error: loginError, login: loginMutate, isLoading: isLoginLoading } = useLoginUser()
  const { logout: logoutMutate, isLoading: isLogoutLoading } = useLogoutUser()
  const { setIsLoading } = useLoading()

  // Check token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken && !isTokenExpired(storedToken)) {
      setIsAuthenticated(true)
      setToken(storedToken)
    } else if (storedToken) {
      // Token exists but is expired
      handleLogout()
    }
  }, [])

  // Set up periodic token expiration check (every minute)
  useEffect(() => {
    if (!token) return

    const checkInterval = setInterval(() => {
      if (isTokenExpired(token)) {
        handleLogout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkInterval)
  }, [token])

  useEffect(() => {
    setIsLoading(isUserLoading || isLoginLoading || isLogoutLoading)
  }, [isUserLoading, isLoginLoading, isLogoutLoading, setIsLoading])

  const login = async (apartment: string, block: number, password: string): Promise<boolean> => {
    try {
      const response = await loginMutate({ apartment, block, password })

      // Check for access_token or token in the response
      if (response && ("access_token" in response || "token" in response)) {
        // Get the token from whichever field is present
        const token = "access_token" in response ? (response.access_token as string) : (response.token as string)

        localStorage.setItem("token", token)
        setIsAuthenticated(true)
        setToken(token)
        return true
      } else {
        console.error("Login failed: No token in response", response)
      }
    } catch (error) {
      console.error("Login failed:", error)
    }
    return false
  }

  const handleLogout = useCallback(async () => {
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
    }
  }, [token, logoutMutate, setIsLoading])

  const handleDeleteUser = async () => {
    return
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user: userError ? null : (userResponse?.user ?? null),
        token,
        login,
        logout: handleLogout,
        deleteUser: handleDeleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

