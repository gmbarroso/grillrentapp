"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Clock } from "../"
import { Modal } from "../"
import { useAuth } from "../../context/AuthContext"
import "./Header.css"

const Header = () => {
  const { isAuthenticated, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true)
  }

  const handleConfirmLogout = async () => {
    await logout()
    setIsLogoutModalOpen(false)
    navigate("/login")
  }

  const handleCancelLogout = () => {
    setIsLogoutModalOpen(false)
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_n-vMvvALaTZX5Rtz4C8lRCnyzBqTwsBU.png"
            alt="Chácara Sacopã Logo"
            className="header-logo"
          />
          <h1>Chácara Sacopã</h1>
        </div>
        <Clock />
        {isAuthenticated && (
          <nav>
            <ul>
              <li>
                <Link to="/">{t("Header.Home")}</Link>
              </li>
              <li>
                <Link to="/notices">{t("Header.Notices")}</Link>
              </li>
              <li>
                <Link to="/profile">{t("Header.Profile")}</Link>
              </li>
              <li>
                <Link to="/contact">{t("Header.Contact")}</Link>
              </li>
              <li>
                <button onClick={handleLogoutClick}>{t("Header.Logout")}</button>
              </li>
            </ul>
          </nav>
        )}
      </div>

      <Modal isOpen={isLogoutModalOpen} onClose={handleCancelLogout}>
        <div className="confirm-dialog">
          <h2>{t("Logout.ConfirmTitle")}</h2>
          <p>{t("Logout.ConfirmMessage")}</p>
          <div className="dialog-actions">
            <button onClick={handleConfirmLogout} className="delete-button">
              {t("Logout.Confirm")}
            </button>
            <button onClick={handleCancelLogout} className="cancel-button">
              {t("Logout.Cancel")}
            </button>
          </div>
        </div>
      </Modal>
    </header>
  )
}

export default Header

