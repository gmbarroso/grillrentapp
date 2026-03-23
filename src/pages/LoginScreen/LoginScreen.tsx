"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLoading } from "../../context/LoadingContext"
import { useToast } from "../../context/ToastContext"
import { AuthCard, BrandMark } from "../../components"
import { normalizeOrganizationSlug } from "../../utils/organizationSlug"
import { persistOrganizationSlug } from "../../utils/organization-session"
import "./LoginScreen.css"

export default function LoginScreen() {
  const [organizationSlug, setOrganizationSlug] = useState("")
  const [apartment, setApartment] = useState("")
  const [block, setBlock] = useState("1")
  const [password, setPassword] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { t } = useTranslation()
  const { setIsLoading } = useLoading()
  const { showToast } = useToast()
  const ONBOARDING_WELCOME_PREFIX = "onboarding_welcome_seen:"

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message
    if (stateMessage) {
      showToast(stateMessage, "error")
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const blockNumber = Number.parseInt(block) || 1
    const validBlock = blockNumber > 2 ? 2 : blockNumber < 1 ? 1 : blockNumber

    try {
      const normalizedOrganizationSlug = normalizeOrganizationSlug(organizationSlug)

      if (!normalizedOrganizationSlug) {
        showToast(t("Login.InvalidCondominiumCode"), "error")
        return
      }

      const result = await login(normalizedOrganizationSlug, apartment, validBlock, password)
      if (result.success) {
        if (typeof window !== "undefined") {
          const keysToRemove: string[] = []
          for (let index = 0; index < window.sessionStorage.length; index += 1) {
            const key = window.sessionStorage.key(index)
            if (key?.startsWith(ONBOARDING_WELCOME_PREFIX)) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach((key) => window.sessionStorage.removeItem(key))
        }
        persistOrganizationSlug(normalizedOrganizationSlug)
        navigate("/")
      } else {
        const isInvalidSlug = result.errorCode === "INVALID_CONDOMINIUM_CODE"
        showToast(isInvalidSlug ? t("Login.InvalidCondominiumCode") : t("Login.Error"), "error")
      }
    } catch (err) {
      console.error("Login error:", err)
      showToast(t("Login.Error"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page-decoration login-page-decoration-top" aria-hidden="true" />
      <div className="login-page-decoration login-page-decoration-bottom" aria-hidden="true" />
      <div className="login-page-inner">
        <div className="login-brand-wrap">
          <BrandMark />
        </div>
        <AuthCard title="Bem-vindo" subtitle="Entre com os dados do seu condomínio">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="organizationSlug">Código do condomínio</label>
              <input
                id="organizationSlug"
                className="login-input-slug"
                type="text"
                placeholder={`# ${t("Login.CondominiumCode")}`}
                value={organizationSlug}
                onChange={(e) => setOrganizationSlug(e.target.value)}
                required
              />
            </div>

            <div className="login-row">
              <div className="login-field">
                <label htmlFor="apartment">Apartamento</label>
                <input
                  id="apartment"
                  className="login-input"
                  type="text"
                  placeholder={t("Login.Apartment")}
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  required
                />
              </div>
              <div className="login-field login-field-small">
                <label htmlFor="block">Bloco</label>
                <input
                  id="block"
                  className="login-input"
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
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password">Senha</label>
                <button type="button" className="login-link-button" onClick={() => navigate("/forgot-password")}>
                  Esqueceu a senha?
                </button>
              </div>
              <div className="login-password-wrap">
                <input
                  id="password"
                  className="login-input"
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder={t("Login.Password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setIsPasswordVisible((value) => !value)}
                  aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                >
                  {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="login-submit" type="submit">
              {t("Login.SignIn")}
            </button>

            {/* <div className="login-divider">
              <span>Novo por aqui?</span>
            </div> */}

            {/* <button className="login-secondary" type="button" onClick={() => navigate("/signup")}>
              Cadastrar novo condomínio
            </button> */}
          </form>
        </AuthCard>

        <p className="login-caption">Sistema de Gestao Condominial</p>
      </div>
    </div>
  )
}
