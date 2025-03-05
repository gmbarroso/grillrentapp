import type React from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { Home, LoginScreen, SignUp, Profile, Contact } from "./pages"
import { ToastProvider } from "./context/ToastContext"

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
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

