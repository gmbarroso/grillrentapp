import { Loader2, Mail, Save, Undo2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import { fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "./AdminSettingsContactEmail.css"

type ContactEmailDeliveryMode = "in_app_only" | "in_app_and_email"
type ContactEmailReplyToMode = "resident_email" | "custom"

interface ContactEmailSettingsView {
  deliveryMode: ContactEmailDeliveryMode
  recipientEmails: string[]
  fromName: string | null
  fromEmail: string | null
  replyToMode: ContactEmailReplyToMode
  customReplyTo: string | null
  canSendEmail: boolean
  validationErrors: string[]
}

const API_BASE_URL = getApiBaseUrl()

const emptySettings: ContactEmailSettingsView = {
  deliveryMode: "in_app_only",
  recipientEmails: [],
  fromName: null,
  fromEmail: null,
  replyToMode: "resident_email",
  customReplyTo: null,
  canSendEmail: false,
  validationErrors: [],
}

const AdminSettingsContactEmail = () => {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<ContactEmailSettingsView>(emptySettings)
  const [deliveryMode, setDeliveryMode] = useState<ContactEmailDeliveryMode>("in_app_only")
  const [recipientEmailsText, setRecipientEmailsText] = useState("")
  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [replyToMode, setReplyToMode] = useState<ContactEmailReplyToMode>("resident_email")
  const [customReplyTo, setCustomReplyTo] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const applySettingsToForm = (payload: ContactEmailSettingsView) => {
    setSettings(payload)
    setDeliveryMode(payload.deliveryMode)
    setRecipientEmailsText(payload.recipientEmails.join("\n"))
    setFromName(payload.fromName || "")
    setFromEmail(payload.fromEmail || "")
    setReplyToMode(payload.replyToMode)
    setCustomReplyTo(payload.customReplyTo || "")
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/messages/settings/contact-email`)
      if (!response.ok) {
        throw new Error(`Failed to load settings (${response.status})`)
      }

      const payload = (await response.json()) as ContactEmailSettingsView
      applySettingsToForm(payload)
    } catch (error) {
      console.error(handleApiError(error, "/messages/settings/contact-email"))
      showToast("Could not load contact email settings.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const parsedRecipients = useMemo(
    () =>
      recipientEmailsText
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    [recipientEmailsText],
  )

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/messages/settings/contact-email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMode,
          recipientEmails: parsedRecipients,
          fromName: fromName.trim() || null,
          fromEmail: fromEmail.trim() || null,
          replyToMode,
          customReplyTo: replyToMode === "custom" ? customReplyTo.trim() || null : null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save settings (${response.status})`)
      }

      const payload = (await response.json()) as ContactEmailSettingsView
      applySettingsToForm(payload)
      showToast("Contact email settings saved.", "success")
    } catch (error) {
      console.error(handleApiError(error, "/messages/settings/contact-email"))
      showToast("Could not save contact email settings.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const statusLabel =
    settings.deliveryMode === "in_app_only" ? "In-app only" : settings.canSendEmail ? "Email active" : "Needs fixes"

  return (
    <div className="admin-contact-email-page">
      <Link to="/admin/settings" className="settings-back-link">
        <Undo2 size={14} />
        Settings
      </Link>

      <header className="admin-page-heading">
        <h2>Contact Email Delivery</h2>
        <p>Set how contact messages are delivered for this organization.</p>
      </header>

      <section className="contact-email-card">
        <header>
          <div className="head-left">
            <span className="settings-icon green">
              <Mail size={15} />
            </span>
            <div>
              <h3>Delivery Settings</h3>
              <p>Always stores in-app messages. Email is optional.</p>
            </div>
          </div>
          <small className={`status-chip ${settings.canSendEmail ? "connected" : "disconnected"}`}>{statusLabel}</small>
        </header>

        <div className="form-grid">
          <label>
            <span>Delivery Mode</span>
            <select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value as ContactEmailDeliveryMode)}>
              <option value="in_app_only">In-app only</option>
              <option value="in_app_and_email">In-app and email</option>
            </select>
          </label>

          <label className="full">
            <span>Recipient Emails (comma or line separated)</span>
            <textarea
              rows={4}
              value={recipientEmailsText}
              onChange={(event) => setRecipientEmailsText(event.target.value)}
              placeholder="admin1@condo.com, admin2@condo.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>From Name (optional)</span>
            <input
              value={fromName}
              onChange={(event) => setFromName(event.target.value)}
              placeholder="Condominium Team"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>From Email (optional)</span>
            <input
              value={fromEmail}
              onChange={(event) => setFromEmail(event.target.value)}
              placeholder="contact@condo.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>Reply-to Mode</span>
            <select
              value={replyToMode}
              onChange={(event) => setReplyToMode(event.target.value as ContactEmailReplyToMode)}
              disabled={deliveryMode === "in_app_only"}
            >
              <option value="resident_email">Resident email</option>
              <option value="custom">Custom reply-to</option>
            </select>
          </label>

          <label>
            <span>Custom Reply-to</span>
            <input
              value={customReplyTo}
              onChange={(event) => setCustomReplyTo(event.target.value)}
              placeholder="support@condo.com"
              disabled={deliveryMode === "in_app_only" || replyToMode !== "custom"}
            />
          </label>
        </div>

        {settings.validationErrors.length > 0 ? (
          <div className="validation-box">
            <strong>Email delivery validation:</strong>
            <ul>
              {settings.validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <footer>
          <Button variant="secondary" onClick={() => applySettingsToForm(settings)} disabled={isLoading || isSaving}>
            Reset
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? <Loader2 size={14} className="icon-spin" /> : <Save size={14} />}
            Save Settings
          </Button>
        </footer>
      </section>
    </div>
  )
}

export default AdminSettingsContactEmail
