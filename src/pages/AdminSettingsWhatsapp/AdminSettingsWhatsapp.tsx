import { Bot, Cable, MessageCircleMore, Power, Undo2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import "./AdminSettingsWhatsapp.css"

const AdminSettingsWhatsapp = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [autoSend, setAutoSend] = useState(false)

  return (
    <div className="admin-whatsapp-page">
      <Link to="/admin/configuracoes" className="settings-back-link">
        <Undo2 size={14} />
        Configuracoes
      </Link>

      <header className="admin-page-heading">
        <h2>Integracao WhatsApp</h2>
        <p>Conecte via Evolution API para enviar avisos diretamente pelo WhatsApp</p>
      </header>

      <section className="whatsapp-card">
        <header>
          <div className="wh-head-left">
            <span className="settings-icon green"><MessageCircleMore size={15} /></span>
            <div>
              <h3>Evolution API</h3>
              <p>Credenciais de acesso a instancia</p>
            </div>
          </div>
          <small className="status-chip disconnected">Desconectado</small>
        </header>

        <div className="wh-form-grid">
          <label>
            <span>URL da Instancia</span>
            <input placeholder="https://api.evolution.com/instance/your-instance" />
          </label>
          <label>
            <span>API Key</span>
            <input placeholder="Sua chave de API" />
          </label>
          <label>
            <span>Numero do WhatsApp</span>
            <input placeholder="+55 21 99999-9999" />
          </label>
        </div>

        <div className="toggle-row">
          <div>
            <strong>Envio Automatico</strong>
            <p>Enviar avisos automaticamente ao criar</p>
          </div>
          <button
            type="button"
            className={`switch ${autoSend ? "on" : ""}`.trim()}
            onClick={() => setAutoSend((prev) => !prev)}
            aria-label="Alternar envio automatico"
          >
            <span></span>
          </button>
        </div>

        <footer>
          <Button variant="secondary" onClick={() => showToast("Teste de conexao em breve.", "success")}>
            <Cable size={14} />
            Testar Conexao
          </Button>
          <Button variant="primary" onClick={() => showToast("Configuracoes salvas com sucesso.", "success")}>Salvar Configuracoes</Button>
        </footer>
      </section>

      <section className="whatsapp-card">
        <header className="status-head">
          <h3>
            <Bot size={15} />
            Status da Integracao
          </h3>
        </header>

        <div className="status-list">
          <article>
            <div>
              <strong>Evolution API</strong>
              <p>Conexao com o servidor</p>
            </div>
            <span><Power size={12} /> Inativo</span>
          </article>
          <article>
            <div>
              <strong>WhatsApp</strong>
              <p>Sessao ativa do WhatsApp</p>
            </div>
            <span><Power size={12} /> Inativo</span>
          </article>
          <article>
            <div>
              <strong>Envio Automatico</strong>
              <p>Avisos enviados ao criar</p>
            </div>
            <span><Power size={12} /> Inativo</span>
          </article>
        </div>
      </section>

      <Button variant="secondary" className="back-button" onClick={() => navigate("/admin/configuracoes")}>
        <Undo2 size={14} />
        Voltar
      </Button>
    </div>
  )
}

export default AdminSettingsWhatsapp
