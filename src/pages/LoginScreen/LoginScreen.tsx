"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useLoading } from "../../context/LoadingContext"
import { useToast } from "../../context/ToastContext"
import { Button } from "../../components"
import "./LoginScreen.css"

export default function LoginScreen() {
  const [apartment, setApartment] = useState("")
  const [block, setBlock] = useState("1")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()
  const { setIsLoading } = useLoading()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const blockNumber = Number.parseInt(block) || 1
    const validBlock = blockNumber > 2 ? 2 : blockNumber < 1 ? 1 : blockNumber

    try {
      const success = await login(apartment, validBlock, password)
      if (success) {
        navigate("/")
      } else {
        showToast(t("Login.Error"), "error")
      }
    } catch (err) {
      console.error("Login error:", err)
      showToast(t("Login.Error"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="form-container">
        <div className="login-brand">
          <img src="/images/logo.png" alt="Chácara Sacopã Logo" className="login-logo" />
        </div>
        <h2 className="title">{t("Login.Title")}</h2>
        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            placeholder={t("Login.Apartment")}
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            required
          />
          <input
            className="input"
            type="text"
            placeholder={t("Login.Block")}
            value={block}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "")
              setBlock(value)
            }}
            onBlur={() => {
              const num = Number.parseInt(block) || 1
              setBlock(num > 2 ? "2" : num < 1 ? "1" : num.toString())
            }}
            required
          />
          <input
            className="input"
            type="password"
            placeholder={t("Login.Password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button variant="primary" type="submit" fullWidth>
            {t("Login.SignIn")}
          </Button>
        </form>
      </div>
    </div>
  )
}

