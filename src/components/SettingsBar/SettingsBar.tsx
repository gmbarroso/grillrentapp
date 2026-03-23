"use client"

import type React from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/ThemeContext"
import "./SettingsBar.css"
import "flag-icons/css/flag-icons.min.css"

const SettingsBar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { toggleTheme, resolvedTheme } = useTheme()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem("language", lng)
  }

  return (
    <div className="settings-bar">
      <div className="settings-bar-content">
        <div className="theme-switch">
          <label className="switch">
            <input type="checkbox" checked={resolvedTheme === "dark"} onChange={toggleTheme} />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="language-selector">
          <button onClick={() => changeLanguage("pt")} aria-label="Português">
            <span className="fi fi-br" title="Português"></span>
          </button>
          <button onClick={() => changeLanguage("en")} aria-label="Inglês">
            <span className="fi fi-us" title="Inglês"></span>
          </button>
          <button onClick={() => changeLanguage("es")} aria-label="Español">
            <span className="fi fi-es" title="Español"></span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsBar
