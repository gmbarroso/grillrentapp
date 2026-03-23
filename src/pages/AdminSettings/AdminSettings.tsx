import { Bell, Building2, ChevronRight, Mail, MessageSquareText, Palette, Shield } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { fetchWithAuthHandling, getApiBaseUrl } from "../../utils/api"
import "./AdminSettings.css"

const AdminSettings = () => {
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const [contactEmailStatus, setContactEmailStatus] = useState<"in_app_only" | "active" | "invalid">("in_app_only")
  const API_BASE_URL = getApiBaseUrl()

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const [whatsappResponse, contactResponse] = await Promise.all([
          fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings`),
          fetchWithAuthHandling(`${API_BASE_URL}/messages/settings/contact-email`),
        ])

        if (whatsappResponse.ok) {
          const whatsappData = (await whatsappResponse.json()) as { status?: string }
          setWhatsappConnected(whatsappData.status === "connected")
        }

        if (contactResponse.ok) {
          const contactData = (await contactResponse.json()) as {
            deliveryMode?: string
            canSendEmail?: boolean
          }
          if (contactData.deliveryMode === "in_app_only") {
            setContactEmailStatus("in_app_only")
          } else if (contactData.canSendEmail) {
            setContactEmailStatus("active")
          } else {
            setContactEmailStatus("invalid")
          }
        }
      } catch {
        setWhatsappConnected(false)
        setContactEmailStatus("in_app_only")
      }
    }

    void loadStatuses()
  }, [API_BASE_URL])

  return (
    <div className="admin-settings-page">
      <header className="admin-page-heading">
        <h2>Configurações</h2>
        <p>Gerencie a identidade do condomínio e as integrações</p>
      </header>

      <section className="admin-settings-grid">
        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon blue">
              <Building2 size={15} />
            </span>
          </div>
          <h3>Identidade</h3>
          <p>Nome, logotipo, endereço e dados de contato</p>
          <Link to="/admin/settings/identity" className="settings-link">
            Configurar <ChevronRight size={14} />
          </Link>
        </article>

        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon green">
              <MessageSquareText size={15} />
            </span>
            <small className={`status-chip ${whatsappConnected ? "connected" : "disconnected"}`}>
              {whatsappConnected ? "Conectado" : "Desconectado"}
            </small>
          </div>
          <h3>Integração WhatsApp</h3>
          <p>Conecte a Evolution API e mapeie os grupos da sua organização</p>
          <Link to="/admin/settings/whatsapp" className="settings-link">
            Configurar <ChevronRight size={14} />
          </Link>
        </article>

        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon cyan">
              <Mail size={15} />
            </span>
            <small
              className={`status-chip ${
                contactEmailStatus === "active" ? "connected" : contactEmailStatus === "invalid" ? "disconnected" : "soon"
              }`}
            >
              {contactEmailStatus === "active" ? "E-mail ativo" : contactEmailStatus === "invalid" ? "Requer ajustes" : "Apenas no app"}
            </small>
          </div>
          <h3>Entrega de E-mail de Contato</h3>
          <p>Regras por organização para apenas no app ou app + e-mail</p>
          <Link to="/admin/settings/contact-email" className="settings-link">
            Configurar <ChevronRight size={14} />
          </Link>
        </article>

        <article className="settings-card disabled">
          <div className="settings-card-head">
            <span className="settings-icon yellow">
              <Bell size={15} />
            </span>
            <small className="status-chip soon">Em breve</small>
          </div>
          <h3>Notificações</h3>
          <p>Preferências de envio de avisos e alertas automáticos</p>
        </article>

        <article className="settings-card disabled">
          <div className="settings-card-head">
            <span className="settings-icon cyan">
              <Palette size={15} />
            </span>
            <small className="status-chip soon">Em breve</small>
          </div>
          <h3>Aparência</h3>
          <p>Cores, temas e personalização visual do sistema</p>
        </article>

        <article className="settings-card disabled">
          <div className="settings-card-head">
            <span className="settings-icon red">
              <Shield size={15} />
            </span>
            <small className="status-chip soon">Em breve</small>
          </div>
          <h3>Segurança</h3>
          <p>Políticas de senha, sessões ativas e permissões</p>
        </article>
      </section>
    </div>
  )
}

export default AdminSettings
