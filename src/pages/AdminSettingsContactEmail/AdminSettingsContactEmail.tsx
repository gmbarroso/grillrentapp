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
  smtpHost: string | null
  smtpPort: number | null
  smtpSecure: boolean | null
  smtpUser: string | null
  smtpFrom: string | null
  hasSmtpPassword: boolean
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
  smtpHost: null,
  smtpPort: null,
  smtpSecure: null,
  smtpUser: null,
  smtpFrom: null,
  hasSmtpPassword: false,
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
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("465")
  const [smtpSecure, setSmtpSecure] = useState("true")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpFrom, setSmtpFrom] = useState("")
  const [smtpAppPassword, setSmtpAppPassword] = useState("")
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
    setSmtpHost(payload.smtpHost || "")
    setSmtpPort(payload.smtpPort ? String(payload.smtpPort) : "465")
    setSmtpSecure(payload.smtpSecure === null ? "true" : payload.smtpSecure ? "true" : "false")
    setSmtpUser(payload.smtpUser || "")
    setSmtpFrom(payload.smtpFrom || "")
    setSmtpAppPassword("")
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/messages/settings/contact-email`)
      if (!response.ok) {
        throw new Error(`Falha ao carregar configurações (${response.status})`)
      }

      const payload = (await response.json()) as ContactEmailSettingsView
      applySettingsToForm(payload)
    } catch (error) {
      console.error(handleApiError(error, "/messages/settings/contact-email"))
      showToast("Não foi possível carregar as configurações de e-mail de contato.", "error")
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
          smtpHost: smtpHost.trim() || null,
          smtpPort: smtpPort.trim() ? Number(smtpPort.trim()) : null,
          smtpSecure: smtpSecure === "true",
          smtpUser: smtpUser.trim() || null,
          smtpFrom: smtpFrom.trim() || null,
          smtpAppPassword: smtpAppPassword.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao salvar configurações (${response.status})`)
      }

      const payload = (await response.json()) as ContactEmailSettingsView
      applySettingsToForm(payload)
      showToast("Configurações de e-mail de contato salvas.", "success")
    } catch (error) {
      console.error(handleApiError(error, "/messages/settings/contact-email"))
      showToast("Não foi possível salvar as configurações de e-mail de contato.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const statusLabel =
    settings.deliveryMode === "in_app_only" ? "Apenas no app" : settings.canSendEmail ? "E-mail ativo" : "Requer ajustes"

  return (
    <div className="admin-contact-email-page">
      <Link to="/admin/settings" className="settings-back-link">
        <Undo2 size={14} />
        Configurações
      </Link>

      <header className="admin-page-heading">
        <h2>Entrega de E-mail de Contato</h2>
        <p>Defina como as mensagens de contato serão entregues para esta organização.</p>
      </header>

      <section className="contact-email-card">
        <header>
          <div className="head-left">
            <span className="settings-icon green">
              <Mail size={15} />
            </span>
            <div>
              <h3>Configurações de Entrega</h3>
              <p>Sempre armazena mensagens no app. E-mail é opcional.</p>
            </div>
          </div>
          <small className={`status-chip ${settings.canSendEmail ? "connected" : "disconnected"}`}>{statusLabel}</small>
        </header>

        <div className="form-grid">
          <label>
            <span>Modo de Entrega</span>
            <select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value as ContactEmailDeliveryMode)}>
              <option value="in_app_only">Apenas no app</option>
              <option value="in_app_and_email">No app e por e-mail</option>
            </select>
          </label>

          <label className="full">
            <span>E-mails de Destino (separados por vírgula ou linha)</span>
            <textarea
              rows={4}
              value={recipientEmailsText}
              onChange={(event) => setRecipientEmailsText(event.target.value)}
              placeholder="admin1@condo.com, admin2@condo.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>Nome do Remetente (opcional)</span>
            <input
              value={fromName}
              onChange={(event) => setFromName(event.target.value)}
              placeholder="Equipe do Condomínio"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>E-mail do Remetente (opcional)</span>
            <input
              value={fromEmail}
              onChange={(event) => setFromEmail(event.target.value)}
              placeholder="contact@condo.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>Modo de Reply-To</span>
            <select
              value={replyToMode}
              onChange={(event) => setReplyToMode(event.target.value as ContactEmailReplyToMode)}
              disabled={deliveryMode === "in_app_only"}
            >
              <option value="resident_email">E-mail do morador</option>
              <option value="custom">Reply-To personalizado</option>
            </select>
          </label>

          <label>
            <span>Reply-To Personalizado</span>
            <input
              value={customReplyTo}
              onChange={(event) => setCustomReplyTo(event.target.value)}
              placeholder="support@condo.com"
              disabled={deliveryMode === "in_app_only" || replyToMode !== "custom"}
            />
          </label>

          <label>
            <span>SMTP Host</span>
            <input
              value={smtpHost}
              onChange={(event) => setSmtpHost(event.target.value)}
              placeholder="smtp.gmail.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>SMTP Port</span>
            <input
              value={smtpPort}
              onChange={(event) => setSmtpPort(event.target.value.replace(/[^\d]/g, ""))}
              placeholder="465"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>SMTP Secure</span>
            <select
              value={smtpSecure}
              onChange={(event) => setSmtpSecure(event.target.value)}
              disabled={deliveryMode === "in_app_only"}
            >
              <option value="true">Verdadeiro (SSL/TLS)</option>
              <option value="false">Falso (STARTTLS/plano)</option>
            </select>
          </label>

          <label>
            <span>SMTP User</span>
            <input
              value={smtpUser}
              onChange={(event) => setSmtpUser(event.target.value)}
              placeholder="mailer@condo.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>SMTP From</span>
            <input
              value={smtpFrom}
              onChange={(event) => setSmtpFrom(event.target.value)}
              placeholder="noreply@condo.com"
              disabled={deliveryMode === "in_app_only"}
            />
          </label>

          <label>
            <span>Senha de App SMTP {settings.hasSmtpPassword ? "(salva)" : "(obrigatória)"}</span>
            <input
              type="password"
              value={smtpAppPassword}
              onChange={(event) => setSmtpAppPassword(event.target.value)}
              placeholder={settings.hasSmtpPassword ? "Deixe em branco para manter a senha atual" : "Informe a senha de app"}
              disabled={deliveryMode === "in_app_only"}
            />
          </label>
        </div>

        {settings.validationErrors.length > 0 ? (
          <div className="validation-box">
            <strong>Validação da entrega por e-mail:</strong>
            <ul>
              {settings.validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <footer>
          <Button variant="secondary" onClick={() => applySettingsToForm(settings)} disabled={isLoading || isSaving}>
            Redefinir
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? <Loader2 size={14} className="icon-spin" /> : <Save size={14} />}
            Salvar configurações
          </Button>
        </footer>
      </section>

      <section className="smtp-guidance-card">
        <h3>Guia de configuração SMTP</h3>
        <ul>
          <li>Os e-mails de destino devem ser apenas caixas de entrada de administradores. Moradores não são adicionados automaticamente.</li>
          <li>O modo padrão é Apenas no app. Mantenha esse modo até configurar o SMTP da organização.</li>
          <li>No modo No app e por e-mail, configure host SMTP, porta, segurança, usuário e remetente no nível da organização.</li>
          <li>A senha de app SMTP é somente escrita e criptografada em repouso. Nunca é retornada em texto puro.</li>
          <li>Não existe fallback SMTP global quando a organização habilita entrega por e-mail.</li>
        </ul>
      </section>
    </div>
  )
}

export default AdminSettingsContactEmail
