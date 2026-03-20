import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { AuthCard, BrandMark } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useForgotPassword } from "../../hooks/user/useForgotPassword"
import { normalizeOrganizationSlug } from "../../utils/organizationSlug"
import { readStoredOrganizationSlug } from "../../utils/organization-session"
import "./ForgotPassword.css"

export default function ForgotPasswordRequest() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { requestReset, isLoading } = useForgotPassword()
  const [organizationSlug, setOrganizationSlug] = useState(readStoredOrganizationSlug())
  const [email, setEmail] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedOrganizationSlug = normalizeOrganizationSlug(organizationSlug)
    if (!normalizedOrganizationSlug) {
      showToast("Código do condomínio inválido.", "error")
      return
    }
    try {
      const response = await requestReset({
        organizationSlug: normalizedOrganizationSlug,
        email: email.trim().toLowerCase(),
      })
      showToast("Se a conta existir, as instruções de redefinição foram enviadas.", "success")
      navigate("/reset-password", {
        state: {
          organizationSlug: normalizedOrganizationSlug,
          resetTokenPreview: response.resetTokenPreview,
        },
      })
    } catch {
      showToast("Não foi possível iniciar a redefinição de senha.", "error")
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-inner">
        <div className="forgot-password-brand-wrap">
          <BrandMark />
        </div>

        <AuthCard title="Esqueci minha senha" subtitle="Solicite um token de redefinição por e-mail">
          <form className="forgot-password-form" onSubmit={submit}>
            <div className="forgot-password-field">
              <label htmlFor="organizationSlug">Código do condomínio</label>
              <input
                id="organizationSlug"
                type="text"
                value={organizationSlug}
                onChange={(event) => setOrganizationSlug(event.target.value)}
                required
              />
            </div>

            <div className="forgot-password-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <button className="forgot-password-submit" type="submit" disabled={isLoading}>
              Solicitar redefinição
            </button>
            <button className="forgot-password-secondary" type="button" onClick={() => navigate("/login")}>
              Voltar ao login
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  )
}
