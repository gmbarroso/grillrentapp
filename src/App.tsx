import { BrowserRouter as Router } from "react-router-dom"
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

  return (
    <div className="app">
      <Header />
      <SettingsBar />
      <main className="main-content">
        <AppRoutes />
      </main>
      <Footer />
      {isLoading && <LoadingSpinner />}
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

