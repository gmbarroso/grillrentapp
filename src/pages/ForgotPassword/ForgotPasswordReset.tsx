import { useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { AuthCard, BrandMark, Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useForgotPassword } from "../../hooks/user/useForgotPassword"
import { normalizeOrganizationSlug } from "../../utils/organizationSlug"
import { readStoredOrganizationSlug } from "../../utils/organization-session"
import { meetsPasswordPolicy, PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy"
import "./ForgotPassword.css"

export default function ForgotPasswordReset() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { confirmReset, isLoading } = useForgotPassword()
  const state = (location.state as { organizationSlug?: string } | null) || null

  const [organizationSlug, setOrganizationSlug] = useState(state.organizationSlug || readStoredOrganizationSlug())
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedOrganizationSlug = normalizeOrganizationSlug(organizationSlug)
    if (!normalizedOrganizationSlug) {
      showToast("Código do condomínio inválido.", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showToast("As senhas não conferem.", "error")
      return
    }
    if (!meetsPasswordPolicy(newPassword)) {
      showToast(PASSWORD_POLICY_MESSAGE, "error")
      return
    }
    try {
      await confirmReset({
        organizationSlug: normalizedOrganizationSlug,
        token: token.trim(),
        newPassword,
      })
      showToast("Senha redefinida com sucesso. Faça login para continuar.", "success")
      navigate("/login")
    } catch {
      showToast("Token inválido ou expirado.", "error")
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-inner">
        <div className="forgot-password-brand-wrap">
          <BrandMark />
        </div>

        <AuthCard title="Redefinir senha" subtitle="Informe o token de redefinição e sua nova senha">
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
              <label htmlFor="reset-token">Token de redefinição</label>
              <input
                id="reset-token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
              />
            </div>

            <div className="forgot-password-field">
              <label htmlFor="new-password">Nova senha</label>
              <small className="forgot-password-rule">{PASSWORD_POLICY_MESSAGE}</small>
              <div className="forgot-password-input-wrap">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  maxLength={100}
                  required
                />
                <button type="button" className="forgot-password-toggle" onClick={() => setShowNewPassword((value) => !value)}>
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="forgot-password-field">
              <label htmlFor="confirm-password">Confirmar nova senha</label>
              <small className="forgot-password-rule">Deve ser igual à nova senha.</small>
              <div className="forgot-password-input-wrap">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  maxLength={100}
                  required
                />
                <button type="button" className="forgot-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} loadingText="Validando...">
              Redefinir senha
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate("/login")} disabled={isLoading}>
              Voltar ao login
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  )
}
