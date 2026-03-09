"use client"

import type React from "react"
import { Route, Routes, Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import {
  AdminBookings,
  AdminNotices,
  AdminResidents,
  AdminResources,
  AdminSettings,
  AdminSettingsBranding,
  AdminSettingsWhatsapp,
  Home,
  LoginScreen,
  SignUp,
  Profile,
  Contact,
  Notices,
  MyReservations,
} from "./pages"
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
        <Route path="/mybookeddates" element={<MyReservations />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/reservas" element={<AdminBookings />} />
        <Route path="/admin/moradores" element={<AdminResidents />} />
        <Route path="/admin/resources" element={<AdminResources />} />
        <Route path="/admin/notices" element={<AdminNotices />} />
        <Route path="/admin/configuracoes" element={<AdminSettings />} />
        <Route path="/admin/configuracoes/identidade" element={<AdminSettingsBranding />} />
        <Route path="/admin/configuracoes/whatsapp" element={<AdminSettingsWhatsapp />} />
      </Route>
    </Routes>
  )
}
