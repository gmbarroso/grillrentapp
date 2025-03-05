import type React from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "../../context/ThemeContext"
import "./SettingsBar.css"

const SettingsBar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { toggleTheme } = useTheme()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem("language", lng)
  }

  return (
    <div className="settings-bar">
      <div className="settings-bar-content">
        <div className="theme-switch">
          <label className="switch">
            <input type="checkbox" onChange={toggleTheme} />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="language-selector">
          <button onClick={() => changeLanguage("pt")}>🇧🇷</button>
          <button onClick={() => changeLanguage("en")}>🇺🇸</button>
          <button onClick={() => changeLanguage("es")}>🇪🇸</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsBar

