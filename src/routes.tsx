"use client"

import type React from "react"
import { useEffect, useRef } from "react"
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
  ForgotPasswordRequest,
  ForgotPasswordReset,
  SignUp,
  Profile,
  Contact,
  Notices,
  MyReservations,
  OnboardingEmail,
  OnboardingVerifyEmail,
  OnboardingChangePassword,
  OnboardingWelcome,
  ChangePassword,
} from "./pages"
import { DashboardHomeSkeleton, DashboardLayout, LoadingSpinner } from "./components"
import "./routes.css"

const resolveOnboardingRoute = (flags: {
  mustProvideEmail: boolean
  mustVerifyEmail: boolean
  mustChangePassword: boolean
}): string => {
  void flags
  return "/onboarding/email"
}

const getWelcomeSeenKey = (userId?: string) => `onboarding_welcome_seen:${userId || "anonymous"}`

const hasSeenOnboardingWelcome = (userId?: string): boolean => {
  if (typeof window === "undefined") return true
  return window.sessionStorage.getItem(getWelcomeSeenKey(userId)) === "true"
}

const residentOnboardingAllowedDashboardPaths = new Set([
  "/profile",
])

const ProtectedDashboardLayout: React.FC = () => {
  const { isAuthenticated, isAuthResolved, onboarding, user } = useAuth()
  const location = useLocation()
  const shouldShowWelcome =
    user?.role === "resident"
    && onboarding.onboardingRequired
    && !hasSeenOnboardingWelcome(user.id)

  if (!isAuthResolved) {
    if (location.pathname === "/") {
      return <DashboardHomeSkeleton />
    }

    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (user?.role !== "admin" && location.pathname.startsWith("/admin/")) {
    return <Navigate to="/" replace />
  }
  if (
    user?.role === "resident"
    && onboarding.onboardingRequired
    && !residentOnboardingAllowedDashboardPaths.has(location.pathname)
  ) {
    if (shouldShowWelcome) {
      return <Navigate to="/onboarding/welcome" replace />
    }
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
  const shouldShowWelcome =
    user?.role === "resident"
    && onboarding.onboardingRequired
    && !hasSeenOnboardingWelcome(user?.id)
  if (!isAuthResolved) {
    if (location.pathname === "/") {
      return <DashboardHomeSkeleton />
    }

    return <LoadingSpinner />
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
  if (location.pathname === "/onboarding/welcome" && !shouldShowWelcome) {
    return <Navigate to={resolveOnboardingRoute(onboarding)} replace />
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-shell-dashboard" aria-hidden="true">
        <DashboardLayout>
          <DashboardHomeSkeleton />
        </DashboardLayout>
      </div>
      <div className="onboarding-shell-overlay">
        <div className="onboarding-shell-modal">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const LogoutRoute: React.FC = () => {
  const { isAuthenticated, isAuthResolved, logout } = useAuth()
  const hasTriggeredLogoutRef = useRef(false)

  useEffect(() => {
    if (!isAuthResolved || !isAuthenticated || hasTriggeredLogoutRef.current) return
    hasTriggeredLogoutRef.current = true
    void logout()
  }, [isAuthResolved, isAuthenticated, logout])

  if (!isAuthResolved) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <LoadingSpinner />
}

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
      <Route path="/reset-password" element={<ForgotPasswordReset />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedOnboardingLayout />}>
        <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
        <Route path="/onboarding/email" element={<OnboardingEmail />} />
        <Route path="/onboarding/verify-email" element={<OnboardingVerifyEmail />} />
        <Route path="/onboarding/change-password" element={<OnboardingChangePassword />} />
      </Route>
      <Route element={<ProtectedDashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mybookeddates" element={<MyReservations />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/bookeddates" element={<AdminBookings />} />
        <Route path="/admin/residents" element={<AdminResidents />} />
        <Route path="/admin/resources" element={<AdminResources />} />
        <Route path="/admin/notices" element={<AdminNotices />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/settings/identity" element={<AdminSettingsBranding />} />
        <Route path="/admin/settings/whatsapp" element={<AdminSettingsWhatsapp />} />
        <Route path="/admin/settings/contact-email" element={<AdminSettingsContactEmail />} />
        <Route path="/admin/moradores" element={<Navigate to="/admin/residents" replace />} />
        <Route path="/admin/reservas" element={<Navigate to="/admin/bookeddates" replace />} />
        <Route path="/admin/configuracoes" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/configuracoes/identidade" element={<Navigate to="/admin/settings/identity" replace />} />
        <Route path="/admin/configuracoes/whatsapp" element={<Navigate to="/admin/settings/whatsapp" replace />} />
        <Route path="/admin/configuracoes/email-contato" element={<Navigate to="/admin/settings/contact-email" replace />} />
      </Route>
    </Routes>
  )
}
