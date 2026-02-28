"use client"

import type React from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { Home, LoginScreen, SignUp, Profile, Contact, Notices } from "./pages"
import { ToastProvider } from "./context/ToastContext"
import { LoadingSpinner } from "./components"

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthResolved } = useAuth()

  if (!isAuthResolved) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <LoadingSpinner />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export const AppRoutes = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/notices"
          element={
            <ProtectedRoute>
              <Notices />
            </ProtectedRoute>
          }
        />
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
