import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import { fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "./OnboardingFlow.css"

const API_BASE_URL = getApiBaseUrl()

export default function OnboardingEmail() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSubmitting(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/users/onboarding/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Failed to submit onboarding email (${response.status})`)
      }

      showToast("Email saved. Verify to continue onboarding.", "success")
      navigate("/onboarding/verify-email")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/email"))
      showToast("Could not save onboarding email.", "error")
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
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="resident@condo.com"
              required
            />
          </label>

          <div className="onboarding-actions">
            <Button type="submit" disabled={isSubmitting}>
              Continue
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
