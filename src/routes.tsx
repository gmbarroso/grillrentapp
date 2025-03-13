"use client"

import type React from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { Home, LoginScreen, SignUp, Profile, Contact } from "./pages"
import { ToastProvider } from "./context/ToastContext"
import { useState, useEffect } from "react"
import { LoadingSpinner } from "./components"

// Update the ProtectedRoute component to handle loading state
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Give the auth context a moment to initialize
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 1000) // Increased to 1 second for more reliable initialization

    return () => clearTimeout(timer)
  }, [])

  if (isChecking) {
    // Show loading spinner while checking authentication
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <LoadingSpinner />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export const AppRoutes = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  )
}

