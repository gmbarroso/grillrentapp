import type React from "react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import "./SignUp.css"

const SignUp = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [apartment, setApartment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t("SignUp.PasswordMismatch"))
      return
    }

    try {
      const response = await mockSignUpApi(name, email, password, apartment)
      login(response.token, response.user)
      navigate("/")
    } catch (err) {
      setError(t("SignUp.Error"))
    }
  }

  const mockSignUpApi = async (name: string, email: string, password: string, apartment: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password && apartment) {
          resolve({
            token: "mock-jwt-token",
            user: { id: 1, name, email, apartment },
          })
        } else {
          reject(new Error("Invalid input"))
        }
      }, 1000)
    })
  }

  return (
    <div className="signup-container">
      <h2>{t("SignUp.Title")}</h2>
      <form onSubmit={handleSubmit} className="signup-form">
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
        <button type="submit">{t("SignUp.Submit")}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p className="login-link">
        {t("SignUp.HaveAccount")} <Link to="/login">{t("SignUp.Login")}</Link>
      </p>
    </div>
  )
}

export default SignUp

