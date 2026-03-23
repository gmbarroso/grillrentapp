import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../../components"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { extractApiErrorMessage, fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import { meetsPasswordPolicy, PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy"
import "../OnboardingEmail/OnboardingFlow.css"

const API_BASE_URL = getApiBaseUrl()

export default function OnboardingChangePassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { refreshProfile } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast("A confirmação da nova senha não confere.", "error")
      return
    }
    if (currentPassword === newPassword) {
      showToast("A nova senha deve ser diferente da senha temporária.", "error")
      return
    }
    if (!meetsPasswordPolicy(newPassword)) {
      showToast(PASSWORD_POLICY_MESSAGE, "error")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/users/onboarding/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao alterar senha de onboarding (${response.status})`)
        throw new Error(message)
      }

      await response.json()
      await refreshProfile()
      showToast("Senha alterada com sucesso.", "success")
      navigate("/?startTour=1")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/change-password"))
      showToast(error instanceof Error ? error.message : "Não foi possível alterar a senha.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Passo 3</span>
        <h1>Trocar senha temporária</h1>
        <p>Este passo final é obrigatório antes do acesso completo ao app.</p>
        <ul className="onboarding-rules">
          <li>{PASSWORD_POLICY_MESSAGE}</li>
          <li>A nova senha deve ser diferente da senha temporária.</li>
          <li>A confirmação deve ser igual à nova senha.</li>
        </ul>

        <form className="onboarding-form" onSubmit={changePassword}>
          <label htmlFor="onboarding-current-password">
            Senha temporária atual
            <div className="onboarding-password-wrap">
              <input
                id="onboarding-current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
              <button type="button" className="onboarding-password-toggle" onClick={() => setShowCurrentPassword((value) => !value)}>
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label htmlFor="onboarding-new-password">
            Nova senha
            <div className="onboarding-password-wrap">
              <input
                id="onboarding-new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                required
              />
              <button type="button" className="onboarding-password-toggle" onClick={() => setShowNewPassword((value) => !value)}>
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label htmlFor="onboarding-confirm-password">
            Confirmar nova senha
            <div className="onboarding-password-wrap">
              <input
                id="onboarding-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                required
              />
              <button type="button" className="onboarding-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="onboarding-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/onboarding/verify-email")} disabled={isSubmitting}>
              Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} loadingText="Atualizando...">
              Finalizar onboarding
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
