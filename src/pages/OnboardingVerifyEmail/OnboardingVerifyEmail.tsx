import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { extractApiErrorMessage, fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "../OnboardingEmail/OnboardingFlow.css"

const API_BASE_URL = getApiBaseUrl()

export default function OnboardingVerifyEmail() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { refreshProfile } = useAuth()
  const [token, setToken] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const verifyEmail = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSubmitting(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/users/onboarding/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao verificar e-mail de onboarding (${response.status})`)
        throw new Error(message)
      }

      await refreshProfile()
      showToast("E-mail verificado. Próximo passo: alterar sua senha temporária.", "success")
      navigate("/onboarding/change-password")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/verify"))
      showToast(error instanceof Error ? error.message : "Falha na verificação de e-mail. Confira o token e tente novamente.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Passo 2</span>
        <h1>Verifique seu e-mail</h1>
        <p>Cole o token de verificação que você recebeu.</p>

        <form className="onboarding-form" onSubmit={verifyEmail}>
          <label htmlFor="onboarding-email-token">
            Token de verificação
            <input
              id="onboarding-email-token"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Cole o token"
              required
            />
          </label>

          <div className="onboarding-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/onboarding/email")} disabled={isSubmitting}>
              Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} loadingText="Verificando...">
              Verificar
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
