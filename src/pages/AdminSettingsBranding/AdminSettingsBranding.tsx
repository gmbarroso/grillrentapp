import { Building2, Clock3, ImageUp, Mail, MapPin, Phone, Undo2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import "./AdminSettingsBranding.css"

const AdminSettingsBranding = () => {
  const { showToast } = useToast()

  return (
    <div className="admin-branding-page">
      <Link to="/admin/configuracoes" className="settings-back-link">
        <Undo2 size={14} />
        Configuracoes
      </Link>

      <header className="admin-page-heading">
        <h2>Identidade do Condominio</h2>
        <p>Personalize o nome, logotipo e informacoes de contato do condominio</p>
      </header>

      <section className="branding-card">
        <header>
          <span className="settings-icon blue">
            <Building2 size={15} />
          </span>
          <div>
            <h3>Dados do Condominio</h3>
            <p>Essas informacoes aparecem no menu lateral e na pagina de contato</p>
          </div>
        </header>

        <div className="logo-row">
          <div className="logo-box">SZ</div>
          <div className="logo-actions">
            <button type="button" onClick={() => showToast("Upload de imagem sera habilitado em seguida.", "success")}>
              <ImageUp size={14} />
              Enviar imagem
            </button>
            <button type="button" className="danger" onClick={() => showToast("Logotipo removido.", "success")}>
              Remover
            </button>
            <small>PNG, JPG ou SVG. Recomendado 200x200px.</small>
          </div>
        </div>

        <div className="branding-form-grid">
          <label>
            <span><Building2 size={13} />Nome do Condominio</span>
            <input defaultValue="Chacara Sacopa" />
          </label>

          <label className="full">
            <span><MapPin size={13} />Endereco</span>
            <textarea rows={2} defaultValue="Rua Sacopa, 852, Lagoa - Rio de Janeiro - RJ - 22471-180" />
          </label>

          <label>
            <span><Mail size={13} />Email</span>
            <input defaultValue="faleconosco.chacara@gmail.com" />
          </label>

          <label>
            <span><Phone size={13} />Telefone</span>
            <input defaultValue="+55 21 99999-9999" />
          </label>

          <label className="full">
            <span><Clock3 size={13} />Horario de Funcionamento</span>
            <input defaultValue="Segunda a sexta, das 9h as 18h" />
          </label>
        </div>

        <footer>
          <Button variant="secondary" onClick={() => showToast("Alteracoes descartadas.", "success")}>Cancelar</Button>
          <Button variant="primary" onClick={() => showToast("Identidade salva com sucesso.", "success")}>Salvar Identidade</Button>
        </footer>
      </section>
    </div>
  )
}

export default AdminSettingsBranding
