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
      showToast("New password confirmation does not match.", "error")
      return
    }
    if (currentPassword === newPassword) {
      showToast("New password must be different from temporary password.", "error")
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
        const message = await extractApiErrorMessage(response, `Failed to change onboarding password (${response.status})`)
        throw new Error(message)
      }

      await response.json()
      await refreshProfile()
      showToast("Password changed successfully.", "success")
      navigate("/")
    } catch (error) {
      console.error(handleApiError(error, "/users/onboarding/change-password"))
      showToast(error instanceof Error ? error.message : "Could not change password.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-page">
      <section className="onboarding-card">
        <span className="onboarding-chip">Step 3</span>
        <h1>Change temporary password</h1>
        <p>This final step is required before full app access.</p>
        <ul className="onboarding-rules">
          <li>{PASSWORD_POLICY_MESSAGE}</li>
          <li>New password must be different from the temporary password.</li>
          <li>Confirmation must match the new password.</li>
        </ul>

        <form className="onboarding-form" onSubmit={changePassword}>
          <label htmlFor="onboarding-current-password">
            Current temporary password
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
            New password
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
            Confirm new password
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
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} loadingText="Updating...">
              Finish onboarding
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
