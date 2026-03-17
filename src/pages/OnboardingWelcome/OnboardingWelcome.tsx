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
        <span className="onboarding-chip">Welcome</span>
        <h1>Welcome to GrillRent</h1>
        <p>
          This is your first access. Before continuing, you need to complete a few onboarding steps.
        </p>
        <ul className="onboarding-rules">
          <li>First, confirm your contact email and verify it.</li>
          <li>Then you will set your personal password to replace the temporary one.</li>
        </ul>

        <div className="onboarding-actions">
          <Button type="button" onClick={handleContinue} isLoading={isSubmitting} loadingText="Continuing...">
            Confirm and continue
          </Button>
        </div>
      </section>
    </div>
  )
}
