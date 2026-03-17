import { useMemo, useState, type FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { AuthCard, BrandMark } from "../../components"
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
  const state = (location.state as { organizationSlug?: string; resetTokenPreview?: string } | null) || null

  const [organizationSlug, setOrganizationSlug] = useState(state.organizationSlug || readStoredOrganizationSlug())
  const [token, setToken] = useState(state.resetTokenPreview || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const hasPreviewToken = useMemo(() => Boolean(state?.resetTokenPreview), [state])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedOrganizationSlug = normalizeOrganizationSlug(organizationSlug)
    if (!normalizedOrganizationSlug) {
      showToast("Invalid condominium code.", "error")
      return
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error")
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
      showToast("Password reset successfully. Please sign in.", "success")
      navigate("/login")
    } catch {
      showToast("Invalid or expired token.", "error")
    }
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-inner">
        <div className="forgot-password-brand-wrap">
          <BrandMark />
        </div>

        <AuthCard title="Reset password" subtitle="Enter the reset token and your new password">
          <form className="forgot-password-form" onSubmit={submit}>
            <div className="forgot-password-field">
              <label htmlFor="organizationSlug">Condominium code</label>
              <input
                id="organizationSlug"
                type="text"
                value={organizationSlug}
                onChange={(event) => setOrganizationSlug(event.target.value)}
                required
              />
            </div>

            <div className="forgot-password-field">
              <label htmlFor="reset-token">Reset token</label>
              <input
                id="reset-token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
              />
              {hasPreviewToken ? <small>Dev token was auto-filled for local testing.</small> : null}
            </div>

            <div className="forgot-password-field">
              <label htmlFor="new-password">New password</label>
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
              <label htmlFor="confirm-password">Confirm new password</label>
              <small className="forgot-password-rule">Must match the new password.</small>
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

            <button className="forgot-password-submit" type="submit" disabled={isLoading}>
              Reset password
            </button>
            <button className="forgot-password-secondary" type="button" onClick={() => navigate("/login")}>
              Back to login
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  )
}
