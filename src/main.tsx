import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import "./i18n"
import { configureConsoleLevel } from "./utils/console"

if (typeof window !== "undefined" && window.location.hostname === "chacarasacopa.vercel.app") {
  const target = `https://seuze.tech${window.location.pathname}${window.location.search}${window.location.hash}`
  window.location.replace(target)
}

configureConsoleLevel()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
