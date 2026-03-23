import { Bot, Cable, Edit3, MessageCircleMore, Power, RefreshCcw, Save, Undo2, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { Button, SettingsFormPageSkeleton } from "../../components"
import { useToast } from "../../context/ToastContext"
import { fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "./AdminSettingsWhatsapp.css"

interface WhatsappSettingsView {
  provider: string
  status: "connected" | "disconnected"
  baseUrl: string
  instanceName: string
  hasApiKey: boolean
  apiKeyMasked: string | null
  whatsappNumber: string | null
  autoSendNotices: boolean
  noticeGroupJid: string | null
  noticeGroupName: string | null
}

interface GroupOption {
  groupJid: string
  groupName: string
}

const API_BASE_URL = getApiBaseUrl()

const emptySettings: WhatsappSettingsView = {
  provider: "evolution",
  status: "disconnected",
  baseUrl: "",
  instanceName: "",
  hasApiKey: false,
  apiKeyMasked: null,
  whatsappNumber: null,
  autoSendNotices: false,
  noticeGroupJid: null,
  noticeGroupName: null,
}

const AdminSettingsWhatsapp = () => {
  const { showToast } = useToast()

  const [settings, setSettings] = useState<WhatsappSettingsView>(emptySettings)
  const [groups, setGroups] = useState<GroupOption[]>([])

  const [baseUrl, setBaseUrl] = useState("")
  const [instanceName, setInstanceName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [autoSendNotices, setAutoSendNotices] = useState(false)
  const [noticeGroupJid, setNoticeGroupJid] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncingGroups, setIsSyncingGroups] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [groupsError, setGroupsError] = useState<string | null>(null)

  const activeNoticeGroup = useMemo(
    () => groups.find((group) => group.groupJid === noticeGroupJid) || null,
    [groups, noticeGroupJid],
  )

  const applySettingsToForm = (payload: WhatsappSettingsView, noticesGroupJid = "") => {
    setSettings(payload)
    setBaseUrl(payload.baseUrl || "")
    setInstanceName(payload.instanceName || "")
    setWhatsappNumber(payload.whatsappNumber || "")
    setAutoSendNotices(Boolean(payload.autoSendNotices))
    setNoticeGroupJid(noticesGroupJid || payload.noticeGroupJid || "")
  }

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const [initialSettingsRes, bindingsRes] = await Promise.all([
        fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings`),
        fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/bindings`),
      ])

      if (!initialSettingsRes.ok || !bindingsRes.ok) {
        throw new Error("Falha ao carregar configurações do WhatsApp")
      }

      let settingsJson = (await initialSettingsRes.json()) as WhatsappSettingsView
      const bindingsJson = (await bindingsRes.json()) as Array<{ feature: string; groupJid: string }>
      const noticesBinding = bindingsJson.find((binding) => binding.feature === "notices")

      const isNotConfigured =
        !settingsJson.baseUrl.trim() &&
        !settingsJson.instanceName.trim() &&
        !settingsJson.hasApiKey

      if (isNotConfigured) {
        const bootstrapRes = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/bootstrap-legacy`, {
          method: "POST",
        })

        if (bootstrapRes.ok) {
          settingsJson = (await bootstrapRes.json()) as WhatsappSettingsView
          showToast("A conexão Evolution existente foi importada para as configurações da organização.", "success")
        }
      }

      applySettingsToForm(settingsJson, noticesBinding?.groupJid)
      setGroupsError(null)
      const hasStoredConfig = Boolean(settingsJson.baseUrl && settingsJson.instanceName && settingsJson.hasApiKey)
      setIsEditing(!hasStoredConfig)

      if (settingsJson.baseUrl && settingsJson.instanceName && settingsJson.hasApiKey) {
        const groupsRes = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/groups`)
        if (groupsRes.ok) {
          const payload = (await groupsRes.json()) as GroupOption[]
          setGroups(payload)
        }
      }
    } catch (error) {
      console.error(error)
      showToast("Não foi possível carregar as configurações do WhatsApp.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!baseUrl.trim() || !instanceName.trim()) {
      showToast("URL base e nome da instância são obrigatórios.", "error")
      return
    }

    try {
      setIsSaving(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: baseUrl.trim(),
          instanceName: instanceName.trim(),
          apiKey: apiKey.trim(),
          whatsappNumber: whatsappNumber.trim(),
          autoSendNotices,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar configurações do WhatsApp")
      }

      const payload = (await response.json()) as WhatsappSettingsView
      applySettingsToForm(payload, noticeGroupJid)
      setApiKey("")
      setIsEditing(false)
      showToast("Configurações do WhatsApp salvas.", "success")
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings"))
      showToast("Não foi possível salvar as configurações do WhatsApp.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setIsTesting(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: baseUrl.trim(),
          instanceName: instanceName.trim(),
          apiKey: apiKey.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao testar conexão")
      }

      const payload = (await response.json()) as { ok: boolean; statusCode: number | null }
      showToast(
        payload.ok
          ? "A conexão com a Evolution API está ativa."
          : `Falha na conexão${payload.statusCode ? ` (status ${payload.statusCode})` : ""}.`,
        payload.ok ? "success" : "error",
      )
      await loadSettings()
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/test-connection"))
      showToast("Não foi possível testar a conexão.", "error")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncGroups = async () => {
    try {
      setIsSyncingGroups(true)
      setGroupsError(null)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/groups`)
      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Falha ao sincronizar grupos (status ${response.status})${body ? `: ${body}` : ""}`)
      }

      const payload = (await response.json()) as GroupOption[]
      setGroups(payload)
      showToast(`${payload.length} grupo(s) sincronizado(s) da Evolution.`, "success")
    } catch (error) {
      const parsedError = handleApiError(error, "/whatsapp/settings/groups")
      console.error(parsedError)
      setGroupsError(parsedError.message)
      showToast("Não foi possível sincronizar grupos. Verifique credenciais da integração e conectividade da instância.", "error")
    } finally {
      setIsSyncingGroups(false)
    }
  }

  const handleSaveNoticeBinding = async () => {
    if (!noticeGroupJid) {
      showToast("Selecione um grupo de WhatsApp para avisos.", "error")
      return
    }

    const selectedGroup = groups.find((group) => group.groupJid === noticeGroupJid)

    try {
      setIsSaving(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/bindings/notices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupJid: noticeGroupJid,
          groupName: selectedGroup?.groupName || settings.noticeGroupName || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao salvar vínculo do grupo")
      }

      showToast("Vínculo do grupo de avisos salvo.", "success")
      await loadSettings()
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/bindings/notices"))
      showToast("Não foi possível salvar o vínculo do grupo de avisos.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const providerStatusLabel = settings.status === "connected" ? "Conectado" : "Desconectado"
  const isFormLocked = isLoading || isSaving || !isEditing

  if (isLoading) {
    return <SettingsFormPageSkeleton />
  }

  return (
    <div className="admin-whatsapp-page">
      <Link to="/admin/settings" className="settings-back-link">
        <Undo2 size={14} />
        Configurações
      </Link>

      <header className="admin-page-heading">
        <h2>Integração WhatsApp</h2>
        <p>Cada organização pode configurar sua própria instância Evolution e mapear seus próprios grupos.</p>
      </header>

      <section className="whatsapp-card">
        <header>
          <div className="wh-head-left">
            <span className="settings-icon green">
              <MessageCircleMore size={15} />
            </span>
            <div>
              <h3>Evolution API</h3>
              <p>Credenciais por organização e comportamento de entrega</p>
            </div>
          </div>
          <small className={`status-chip ${settings.status === "connected" ? "connected" : "disconnected"}`}>
            {providerStatusLabel}
          </small>
        </header>

        <div className="wh-form-grid">
          <label>
            <span>Evolution Base URL</span>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://evolution-api.myorg.com"
              disabled={isFormLocked}
            />
          </label>

          <label>
            <span>Instance Name</span>
            <input
              value={instanceName}
              onChange={(event) => setInstanceName(event.target.value)}
              placeholder="instancia-condominio"
              disabled={isFormLocked}
            />
          </label>

          <label>
            <span>API Key</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={settings.hasApiKey ? settings.apiKeyMasked || "Chave de API salva" : "Cole a chave de API"}
              disabled={isFormLocked}
            />
          </label>

          <label>
            <span>Número do WhatsApp (opcional)</span>
            <input
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder="+55 21 99999-9999"
              disabled={isFormLocked}
            />
          </label>
        </div>

        <div className="toggle-row">
          <div>
            <strong>Envio Automático de Avisos</strong>
            <p>Novos avisos são enviados automaticamente para o grupo mapeado</p>
          </div>
          <button
            type="button"
            className={`switch ${autoSendNotices ? "on" : ""}`.trim()}
            onClick={() => setAutoSendNotices((prev) => !prev)}
            aria-label="Alternar envio automático de avisos"
            disabled={isFormLocked}
          >
            <span></span>
          </button>
        </div>

        <footer>
          <Button variant="secondary" onClick={() => setIsEditing(true)} disabled={isLoading || isSaving || isEditing}>
            <Edit3 size={14} />
            Editar
          </Button>
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isLoading || isSaving}
            isLoading={isTesting}
            loadingText="Testando..."
          >
            <Cable size={14} />
            Testar conexão
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              applySettingsToForm(settings, settings.noticeGroupJid || "")
              setApiKey("")
              setIsEditing(false)
            }}
            disabled={isLoading || isSaving || !isEditing}
          >
            <X size={14} />
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={isLoading || isTesting || !isEditing}
            isLoading={isSaving}
            loadingText="Salvando configurações..."
          >
            <Save size={14} />
            Salvar configurações
          </Button>
        </footer>
      </section>

      <section className="whatsapp-card">
        <header className="status-head">
          <h3>
            <Bot size={15} />
            Grupos e Mapeamento de Funcionalidades
          </h3>
        </header>

        <div className="group-binding-row">
          <Button
            variant="secondary"
            onClick={handleSyncGroups}
            disabled={isLoading || isSaving}
            isLoading={isSyncingGroups}
            loadingText="Sincronizando..."
          >
            <RefreshCcw size={14} />
            Sincronizar grupos
          </Button>

          <label>
            <span>Grupo para avisos</span>
            <select
              value={noticeGroupJid}
              onChange={(event) => setNoticeGroupJid(event.target.value)}
              disabled={isLoading || isSaving}
            >
              <option value="">Selecione um grupo</option>
              {groups.map((group) => (
                <option key={group.groupJid} value={group.groupJid}>
                  {group.groupName}
                </option>
              ))}
            </select>
          </label>

          <Button variant="primary" onClick={handleSaveNoticeBinding} disabled={isLoading || isSaving || !noticeGroupJid}>
            Salvar grupo
          </Button>
        </div>
        {groupsError ? (
          <div className="group-sync-error">
            <strong>Não foi possível sincronizar grupos.</strong>
            <p>{groupsError}</p>
            <p>Verifique URL da Evolution API, chave de API e se a instância está online.</p>
          </div>
        ) : null}

        {settings.noticeGroupJid ? (
          <p className="bound-group-hint">
            Mapeamento atual: <strong>{settings.noticeGroupName || settings.noticeGroupJid}</strong>
          </p>
        ) : null}

        {activeNoticeGroup ? (
          <p className="bound-group-hint">
            Grupo selecionado: <strong>{activeNoticeGroup.groupName}</strong>
          </p>
        ) : null}
      </section>

      <section className="whatsapp-card">
        <header className="status-head">
          <h3>
            <Bot size={15} />
            Status da Integração
          </h3>
        </header>

        <div className="status-list">
          <article>
            <div>
              <strong>Evolution API</strong>
              <p>Conectividade do provedor</p>
            </div>
            <span className={`status-indicator ${settings.status === "connected" ? "ok" : "off"}`}>
              <Power size={12} /> {providerStatusLabel}
            </span>
          </article>
          <article>
            <div>
              <strong>Grupo de Avisos</strong>
              <p>Grupo de destino para avisos da organização</p>
            </div>
            <span className={`status-indicator ${settings.noticeGroupJid ? "ok" : "off"}`}>
              <Power size={12} /> {settings.noticeGroupJid ? "Mapeado" : "Não mapeado"}
            </span>
          </article>
          <article>
            <div>
              <strong>Automatic Notices</strong>
              <p>Notices sent when created</p>
            </div>
            <span className={`status-indicator ${autoSendNotices ? "ok" : "off"}`}>
              <Power size={12} /> {autoSendNotices ? "Active" : "Inactive"}
            </span>
          </article>
        </div>
      </section>
    </div>
  )
}

export default AdminSettingsWhatsapp
