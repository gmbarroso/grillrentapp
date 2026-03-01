import type React from "react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useRegisterUser } from "../../hooks/user/useRegisterUser"
import "./SignUp.css"

const SignUp = () => {
  const [organizationSlug, setOrganizationSlug] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [apartment, setApartment] = useState("")
  const [block, setBlock] = useState("1")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { register, isLoading } = useRegisterUser()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t("SignUp.PasswordMismatch"))
      return
    }

    try {
      const normalizedOrganizationSlug = organizationSlug
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      if (!normalizedOrganizationSlug) {
        setError(t("SignUp.InvalidCondominiumCode"))
        return
      }

      const parsedBlock = Number.parseInt(block, 10)
      const validBlock = parsedBlock > 2 ? 2 : parsedBlock < 1 || Number.isNaN(parsedBlock) ? 1 : parsedBlock

      await register({
        organizationSlug: normalizedOrganizationSlug,
        name,
        email,
        password,
        apartment,
        block: validBlock,
      })

      const loginResult = await login(normalizedOrganizationSlug, apartment, validBlock, password)
      if (!loginResult.success) {
        setError(t("SignUp.RegisteredPleaseLogin"))
        navigate("/login")
        return
      }
      navigate("/")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message.toLowerCase() : ""
      if (message.includes("invalid condominium code")) {
        setError(t("SignUp.InvalidCondominiumCode"))
        return
      }
      setError(t("SignUp.Error"))
    }
  }

  return (
    <div className="signup-container">
      <h2>{t("SignUp.Title")}</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <input
          type="text"
          placeholder={t("SignUp.CondominiumCode")}
          value={organizationSlug}
          onChange={(e) => setOrganizationSlug(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t("SignUp.Name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={t("SignUp.Email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("SignUp.Password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t("SignUp.ConfirmPassword")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t("SignUp.Apartment")}
          value={apartment}
          onChange={(e) => setApartment(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t("SignUp.Block")}
          value={block}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "")
            setBlock(value)
          }}
          onBlur={() => {
            const num = Number.parseInt(block, 10) || 1
            setBlock(num > 2 ? "2" : num < 1 ? "1" : num.toString())
          }}
          required
        />
        <button type="submit" disabled={isLoading}>
          {t("SignUp.Submit")}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p className="login-link">
        {t("SignUp.HaveAccount")} <Link to="/login">{t("SignUp.Login")}</Link>
      </p>
    </div>
  )
}

export default SignUp
