"use client"

import type React from "react"
import { Route, Routes, Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { Home, LoginScreen, SignUp, Profile, Contact, Notices, MyReservations } from "./pages"
import { DashboardHomeSkeleton, DashboardLayout, LoadingSpinner } from "./components"

const ProtectedDashboardLayout: React.FC = () => {
  const { isAuthenticated, isAuthResolved } = useAuth()
  const location = useLocation()

  if (!isAuthResolved) {
    if (location.pathname === "/") {
      return <DashboardHomeSkeleton />
    }

    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedDashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/minhas-reservas" element={<MyReservations />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}
