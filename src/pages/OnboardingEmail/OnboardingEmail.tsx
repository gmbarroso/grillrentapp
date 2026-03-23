import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { extractApiErrorMessage, fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "./OnboardingFlow.css"

const API_BASE_URL = getApiBaseUrl()

export default function OnboardingEmail() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { refreshProfile } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const normalizedEmail = email.trim()
  const isValidEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidEmailFormat) {
      showToast("Informe um e-mail válido antes de continuar.", "error")
      return
    }
    try {
      setIsSubmitting(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/users/onboarding/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao enviar e-mail de onboarding (${response.status})`)
        throw new Error(message)
      }

      await refreshProfile()
      showToast("E-mail salvo. Verifique para continuar o onboarding.", "success")
      navigate("/onboarding/verify-email")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/email"))
      showToast(error instanceof Error ? error.message : "Não foi possível salvar o e-mail de onboarding.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Passo 1</span>
        <h1>Adicione seu e-mail</h1>
        <p>Você precisa de um e-mail verificado para liberar o acesso completo ao app.</p>

        <form className="onboarding-form" onSubmit={submitEmail}>
          <label htmlFor="onboarding-email">
            Email
            <input
              id="onboarding-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="resident@condo.com"
              required
            />
          </label>

          <div className="onboarding-actions">
            <Button
              type="submit"
              disabled={isSubmitting || !isValidEmailFormat}
              isLoading={isSubmitting}
              loadingText="Salvando..."
            >
              Continuar
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
