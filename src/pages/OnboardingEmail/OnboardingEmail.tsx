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
      showToast("Enter a valid email before continuing.", "error")
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
        const message = await extractApiErrorMessage(response, `Failed to submit onboarding email (${response.status})`)
        throw new Error(message)
      }

      await refreshProfile()
      showToast("Email saved. Verify to continue onboarding.", "success")
      navigate("/onboarding/verify-email")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/email"))
      showToast(error instanceof Error ? error.message : "Could not save onboarding email.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Step 1</span>
        <h1>Add your email</h1>
        <p>You need a verified email to unlock full app access.</p>

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
              loadingText="Saving..."
            >
              Continue
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
