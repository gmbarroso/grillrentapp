import { Bell, Building2, ChevronRight, MessageSquareText, Palette, Shield } from "lucide-react"
import { Link } from "react-router-dom"
import "./AdminSettings.css"

const AdminSettings = () => {
  return (
    <div className="admin-settings-page">
      <header className="admin-page-heading">
        <h2>Configuracoes</h2>
        <p>Gerencie as configuracoes e integracoes do condominio</p>
      </header>

      <section className="admin-settings-grid">
        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon blue">
              <Building2 size={15} />
            </span>
          </div>
          <h3>Identidade do Condominio</h3>
          <p>Nome, logotipo, endereco e informacoes de contato</p>
          <Link to="/admin/configuracoes/identidade" className="settings-link">
            Configurar <ChevronRight size={14} />
          </Link>
        </article>

        <article className="settings-card active">
          <div className="settings-card-head">
            <span className="settings-icon green">
              <MessageSquareText size={15} />
            </span>
            <small className="status-chip disconnected">Desconectado</small>
          </div>
          <h3>Integracao WhatsApp</h3>
          <p>Conectar Evolution API para envio de avisos</p>
          <Link to="/admin/configuracoes/whatsapp" className="settings-link">
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
