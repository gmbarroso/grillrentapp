import { useEffect, useMemo, useState } from "react"
import { Building2, Clock3, Mail, MapPin, Phone, Undo2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button, ImageDropzone, SettingsFormPageSkeleton } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useOrganizationSettings } from "../../hooks/organization/useOrganizationSettings"
import "./AdminSettingsBranding.css"

interface BrandingFormState {
  name: string
  address: string
  email: string
  phone: string
  businessHours: string
  logoUrl: string | null
}

const DEFAULT_FORM: BrandingFormState = {
  name: "",
  address: "",
  email: "",
  phone: "",
  businessHours: "",
  logoUrl: null,
}

const AdminSettingsBranding = () => {
  const { showToast } = useToast()
  const { organization, isLoading, updateOrganization } = useOrganizationSettings()
  const [form, setForm] = useState<BrandingFormState>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const loadedForm = useMemo<BrandingFormState>(() => ({
    name: organization?.name || "",
    address: organization?.address || "",
    email: organization?.email || "",
    phone: organization?.phone || "",
    businessHours: organization?.businessHours || "",
    logoUrl: organization?.logoUrl || null,
  }), [organization])

  useEffect(() => {
    setForm(loadedForm)
  }, [loadedForm])

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Informe o nome do condominio para salvar.", "error")
      return
    }

    setIsSaving(true)
    try {
      await updateOrganization({
        name: form.name.trim(),
        address: form.address,
        email: form.email,
        phone: form.phone,
        businessHours: form.businessHours,
        logoUrl: form.logoUrl,
      })
      showToast("Identidade salva com sucesso.", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel salvar a identidade."
      showToast(message, "error")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <SettingsFormPageSkeleton />
  }

  return (
    <div className="admin-branding-page">
      <Link to="/admin/settings" className="settings-back-link">
        <Undo2 size={14} />
        Configurações
      </Link>

      <header className="admin-page-heading">
        <h2>Identidade</h2>
        <p>Personalize o nome do condomínio, logotipo e dados de contato</p>
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
          <ImageDropzone
            imageUrl={form.logoUrl}
            onImageChange={(logoUrl) => setForm((prev) => ({ ...prev, logoUrl }))}
            onImageRemove={() => {
              setForm((prev) => ({ ...prev, logoUrl: null }))
              showToast("Logotipo removido.", "success")
            }}
            onError={(message) => showToast(message, "error")}
            helperText="PNG, JPG ou SVG. Recomendado 200x200px."
            disabled={isLoading || isSaving}
          />
        </div>

        <div className="branding-form-grid">
          <label>
            <span><Building2 size={13} />Nome do Condominio</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={isLoading || isSaving}
            />
          </label>

          <label className="full">
            <span><MapPin size={13} />Endereco</span>
            <textarea
              rows={2}
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              disabled={isLoading || isSaving}
            />
          </label>

          <label>
            <span><Mail size={13} />Email</span>
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={isLoading || isSaving}
            />
          </label>

          <label>
            <span><Phone size={13} />Telefone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={isLoading || isSaving}
            />
          </label>

          <label className="full">
            <span><Clock3 size={13} />Horario de Funcionamento</span>
            <input
              value={form.businessHours}
              onChange={(event) => setForm((prev) => ({ ...prev, businessHours: event.target.value }))}
              disabled={isLoading || isSaving}
            />
          </label>
        </div>

        <footer>
          <Button
            variant="secondary"
            onClick={() => {
              setForm(loadedForm)
              showToast("Alteracoes descartadas.", "success")
            }}
            disabled={isLoading || isSaving}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? "Salvando..." : "Salvar Identidade"}
          </Button>
        </footer>
      </section>
    </div>
  )
}

export default AdminSettingsBranding
