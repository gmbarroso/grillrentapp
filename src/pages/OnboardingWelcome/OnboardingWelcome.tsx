import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components"
import { useAuth } from "../../context/AuthContext"
import "../OnboardingEmail/OnboardingFlow.css"

const getWelcomeSeenKey = (userId?: string) => `onboarding_welcome_seen:${userId || "anonymous"}`

const resolveNextRoute = (flags: {
  mustProvideEmail: boolean
  mustVerifyEmail: boolean
  mustChangePassword: boolean
}) => {
  if (flags.mustProvideEmail) return "/onboarding/email"
  if (flags.mustVerifyEmail) return "/onboarding/verify-email"
  if (flags.mustChangePassword) return "/onboarding/change-password"
  return "/"
}

export default function OnboardingWelcome() {
  const navigate = useNavigate()
  const { onboarding, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(getWelcomeSeenKey(user?.id), "true")
    }
    setIsSubmitting(true)
    navigate(resolveNextRoute(onboarding))
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Bem-vindo</span>
        <h1>
          Bem-vindo ao <span className="onboarding-brand-seu">Seu.</span><span className="onboarding-brand-ze">Zé</span>
        </h1>
        <p>
          Este é seu primeiro acesso. Antes de continuar, você precisa concluir algumas etapas de onboarding.
        </p>
        <ul className="onboarding-rules">
          <li>Primeiro, confirme seu e-mail de contato e faça a verificação.</li>
          <li>Depois, defina sua senha pessoal para substituir a temporária.</li>
        </ul>

        <div className="onboarding-actions">
          <Button type="button" onClick={handleContinue} isLoading={isSubmitting} loadingText="Continuando...">
            Confirmar e continuar
          </Button>
        </div>
      </section>
    </div>
  )
}
