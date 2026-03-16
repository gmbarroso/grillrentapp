"use client"

import type React from "react"
import { Route, Routes, Navigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import {
  AdminBookings,
  AdminNotices,
  AdminMessages,
  AdminResidents,
  AdminResources,
  AdminSettings,
  AdminSettingsBranding,
  AdminSettingsContactEmail,
  AdminSettingsWhatsapp,
  Home,
  LoginScreen,
  SignUp,
  Profile,
  Contact,
  Notices,
  MyReservations,
  OnboardingEmail,
  OnboardingVerifyEmail,
  OnboardingChangePassword,
} from "./pages"
import { DashboardHomeSkeleton, DashboardLayout, LoadingSpinner } from "./components"

const resolveOnboardingRoute = (flags: {
  mustProvideEmail: boolean
  mustVerifyEmail: boolean
  mustChangePassword: boolean
}): string => {
  if (flags.mustProvideEmail) return "/onboarding/email"
  if (flags.mustVerifyEmail) return "/onboarding/verify-email"
  if (flags.mustChangePassword) return "/onboarding/change-password"
  return "/"
}

const residentOnboardingAllowedDashboardPaths = new Set([
  "/profile",
])

const ProtectedDashboardLayout: React.FC = () => {
  const { isAuthenticated, isAuthResolved, onboarding, user } = useAuth()
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
  if (
    user?.role === "resident"
    && onboarding.onboardingRequired
    && !residentOnboardingAllowedDashboardPaths.has(location.pathname)
  ) {
    return <Navigate to={resolveOnboardingRoute(onboarding)} replace />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

const ProtectedOnboardingLayout: React.FC = () => {
  const { isAuthenticated, isAuthResolved, onboarding, user } = useAuth()
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
  if (user?.role !== "resident") {
    return <Navigate to="/" replace />
  }
  if (!onboarding.onboardingRequired) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedOnboardingLayout />}>
        <Route path="/onboarding/email" element={<OnboardingEmail />} />
        <Route path="/onboarding/verify-email" element={<OnboardingVerifyEmail />} />
        <Route path="/onboarding/change-password" element={<OnboardingChangePassword />} />
      </Route>
      <Route element={<ProtectedDashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mybookeddates" element={<MyReservations />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/reservas" element={<AdminBookings />} />
        <Route path="/admin/residents" element={<AdminResidents />} />
        <Route path="/admin/resources" element={<AdminResources />} />
        <Route path="/admin/notices" element={<AdminNotices />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/settings/identity" element={<AdminSettingsBranding />} />
        <Route path="/admin/settings/whatsapp" element={<AdminSettingsWhatsapp />} />
        <Route path="/admin/settings/contact-email" element={<AdminSettingsContactEmail />} />
        <Route path="/admin/moradores" element={<Navigate to="/admin/residents" replace />} />
        <Route path="/admin/configuracoes" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/configuracoes/identidade" element={<Navigate to="/admin/settings/identity" replace />} />
        <Route path="/admin/configuracoes/whatsapp" element={<Navigate to="/admin/settings/whatsapp" replace />} />
        <Route path="/admin/configuracoes/email-contato" element={<Navigate to="/admin/settings/contact-email" replace />} />
      </Route>
    </Routes>
  )
}
