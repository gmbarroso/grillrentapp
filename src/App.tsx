import { BrowserRouter as Router } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { I18nextProvider } from "react-i18next"
import { SWRConfig } from "swr"
import i18n from "./i18n"
import { Header, Footer } from "./components"
import SettingsBar from "./components/SettingsBar/SettingsBar"
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { LoadingProvider, useLoading } from "./context/LoadingContext"
import { ToastProvider } from "./context/ToastContext"
import { AppRoutes } from "./routes"
import { swrConfig } from "./config/swr-config"
import "./App.css"

function AppContent() {
  const { isLoading } = useLoading()
  const location = useLocation()
  const dashboardRoutes = ["/", "/mybookeddates", "/notices", "/profile", "/contact"]
  const isDashboardRoute = dashboardRoutes.includes(location.pathname) || location.pathname.startsWith("/admin/")
  const hideGlobalChrome = location.pathname === "/login" || location.pathname === "/signup" || isDashboardRoute

  return (
    <div className="app">
      {!hideGlobalChrome && <Header />}
      {!hideGlobalChrome && <SettingsBar />}
      <main className={`main-content ${hideGlobalChrome ? "main-content-fluid" : ""}`.trim()}>
        <AppRoutes />
      </main>
      {!hideGlobalChrome && <Footer />}
      {isLoading && !isDashboardRoute && <LoadingSpinner />}
    </div>
  )
}

function App() {
  return (
    <LoadingProvider>
      <SWRConfig value={swrConfig}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </I18nextProvider>
      </SWRConfig>
    </LoadingProvider>
  )
}

export default App
