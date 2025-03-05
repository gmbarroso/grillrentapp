import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useUserProfile } from "../hooks/user/useUserProfile"
import { useLoginUser } from "../hooks/user/useLoginUser"
import { useLoading } from "../context/LoadingContext"
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
  const {
    data: userResponse,
    error: userError,
    isLoading: isUserLoading
  } = useUserProfile(token)
  const {
    error: loginError,
    login: loginMutate,
    isLoading: isLoginLoading
  } = useLoginUser()
  const { setIsLoading } = useLoading()

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setIsAuthenticated(true)
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    setIsLoading(isUserLoading || isLoginLoading)
  }, [isUserLoading, isLoginLoading, setIsLoading])

  const login = async (apartment: string, block: number, password: string): Promise<boolean> => {
    const response = await loginMutate({ apartment, block, password })
    if (response && "token" in response) {
      const token = response.token as string
      localStorage.setItem("token", token)
      setIsAuthenticated(true)
      setToken(token)
      return true
    } else {
      console.error("Login failed:", loginError)
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setToken(null)
  }

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
        logout,
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

