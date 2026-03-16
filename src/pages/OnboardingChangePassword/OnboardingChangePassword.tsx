import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import { fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "../OnboardingEmail/OnboardingFlow.css"

const API_BASE_URL = getApiBaseUrl()

export default function OnboardingChangePassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (currentPassword === newPassword) {
      showToast("New password must be different from temporary password.", "error")
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
        throw new Error(`Failed to change onboarding password (${response.status})`)
      }

      showToast("Password changed. Onboarding complete.", "success")
      navigate("/")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/change-password"))
      showToast("Could not change password.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Step 3</span>
        <h1>Change temporary password</h1>
        <p>This first password update is required before full app access.</p>

        <form className="onboarding-form" onSubmit={changePassword}>
          <label htmlFor="onboarding-current-password">
            Current temporary password
            <input
              id="onboarding-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>

          <label htmlFor="onboarding-new-password">
            New password
            <input
              id="onboarding-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>

          <div className="onboarding-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/onboarding/verify-email")} disabled={isSubmitting}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Finish onboarding
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
