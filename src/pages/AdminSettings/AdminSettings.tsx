import { Bell, Building2, ChevronRight, MessageSquareText, Palette, Shield } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { fetchWithAuthHandling, getApiBaseUrl } from "../../utils/api"
import "./AdminSettings.css"

const AdminSettings = () => {
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const API_BASE_URL = getApiBaseUrl()

  useEffect(() => {
    const loadWhatsappStatus = async () => {
      try {
        const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings`)
        if (!response.ok) return
        const data = (await response.json()) as { status?: string }
        setWhatsappConnected(data.status === "connected")
      } catch {
        setWhatsappConnected(false)
      }
    }

    void loadWhatsappStatus()
  }, [API_BASE_URL])

  return (
    <div className="admin-settings-page">
      <header className="admin-page-heading">
        <h2>Settings</h2>
        <p>Manage condominium identity and integrations</p>
      </header>

      <section className="admin-settings-grid">
        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon blue">
              <Building2 size={15} />
            </span>
          </div>
          <h3>Identity</h3>
          <p>Name, logo, address and contact details</p>
          <Link to="/admin/settings/identity" className="settings-link">
            Configure <ChevronRight size={14} />
          </Link>
        </article>

        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon green">
              <MessageSquareText size={15} />
            </span>
            <small className={`status-chip ${whatsappConnected ? "connected" : "disconnected"}`}>
              {whatsappConnected ? "Connected" : "Disconnected"}
            </small>
          </div>
          <h3>WhatsApp Integration</h3>
          <p>Connect Evolution API and map your organization groups</p>
          <Link to="/admin/settings/whatsapp" className="settings-link">
            Configure <ChevronRight size={14} />
          </Link>
        </article>

        <article className="settings-card disabled">
          <div className="settings-card-head">
            <span className="settings-icon yellow">
              <Bell size={15} />
            </span>
            <small className="status-chip soon">Em breve</small>
          </div>
          <h3>Notificacoes</h3>
          <p>Preferencias de envio de avisos e alertas automaticos</p>
        </article>

        <article className="settings-card disabled">
          <div className="settings-card-head">
            <span className="settings-icon cyan">
              <Palette size={15} />
            </span>
            <small className="status-chip soon">Em breve</small>
          </div>
          <h3>Aparencia</h3>
          <p>Cores, temas e personalizacao visual do sistema</p>
        </article>

        <article className="settings-card disabled">
          <div className="settings-card-head">
            <span className="settings-icon red">
              <Shield size={15} />
            </span>
            <small className="status-chip soon">Em breve</small>
          </div>
          <h3>Seguranca</h3>
          <p>Politicas de senha, sessoes ativas e permissoes</p>
        </article>
      </section>
    </div>
  )
}

export default AdminSettings
