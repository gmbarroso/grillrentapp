import { Bot, Cable, Edit3, Loader2, MessageCircleMore, Power, RefreshCcw, Save, Undo2, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { Button } from "../../components"
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
        throw new Error("Failed to load WhatsApp settings")
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
          showToast("Existing Evolution connection was imported into organization settings.", "success")
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
      showToast("Could not load WhatsApp settings.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!baseUrl.trim() || !instanceName.trim()) {
      showToast("Base URL and instance name are required.", "error")
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
        throw new Error("Failed to save WhatsApp settings")
      }

      const payload = (await response.json()) as WhatsappSettingsView
      applySettingsToForm(payload, noticeGroupJid)
      setApiKey("")
      setIsEditing(false)
      showToast("WhatsApp settings saved.", "success")
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings"))
      showToast("Could not save WhatsApp settings.", "error")
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
        throw new Error("Failed to test connection")
      }

      const payload = (await response.json()) as { ok: boolean; statusCode: number | null }
      showToast(
        payload.ok
          ? "Connection with Evolution API is active."
          : `Connection failed${payload.statusCode ? ` (status ${payload.statusCode})` : ""}.`,
        payload.ok ? "success" : "error",
      )
      await loadSettings()
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/test-connection"))
      showToast("Could not test connection.", "error")
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
        throw new Error(`Failed to sync groups (status ${response.status})${body ? `: ${body}` : ""}`)
      }

      const payload = (await response.json()) as GroupOption[]
      setGroups(payload)
      showToast(`${payload.length} group(s) synced from Evolution.`, "success")
    } catch (error) {
      const parsedError = handleApiError(error, "/whatsapp/settings/groups")
      console.error(parsedError)
      setGroupsError(parsedError.message)
      showToast("Could not sync groups. Check integration credentials and instance connectivity.", "error")
    } finally {
      setIsSyncingGroups(false)
    }
  }

  const handleSaveNoticeBinding = async () => {
    if (!noticeGroupJid) {
      showToast("Select a WhatsApp group for notices.", "error")
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
        throw new Error("Failed to save group binding")
      }

      showToast("Notices group binding saved.", "success")
      await loadSettings()
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/bindings/notices"))
      showToast("Could not save notices group binding.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const providerStatusLabel = settings.status === "connected" ? "Connected" : "Disconnected"
  const isFormLocked = isLoading || isSaving || !isEditing

  return (
    <div className="admin-whatsapp-page">
      <Link to="/admin/settings" className="settings-back-link">
        <Undo2 size={14} />
        Settings
      </Link>

      <header className="admin-page-heading">
        <h2>WhatsApp Integration</h2>
        <p>Each organization can configure its own Evolution instance and map its own groups.</p>
      </header>

      <section className="whatsapp-card">
        <header>
          <div className="wh-head-left">
            <span className="settings-icon green">
              <MessageCircleMore size={15} />
            </span>
            <div>
              <h3>Evolution API</h3>
              <p>Organization-scoped credentials and delivery behavior</p>
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
              placeholder="condo-instance"
              disabled={isFormLocked}
            />
          </label>

          <label>
            <span>API Key</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={settings.hasApiKey ? settings.apiKeyMasked || "API key saved" : "Paste API key"}
              disabled={isFormLocked}
            />
          </label>

          <label>
            <span>WhatsApp Number (optional)</span>
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
            <strong>Automatic Notices Delivery</strong>
            <p>New notices are sent automatically to the mapped group</p>
          </div>
          <button
            type="button"
            className={`switch ${autoSendNotices ? "on" : ""}`.trim()}
            onClick={() => setAutoSendNotices((prev) => !prev)}
            aria-label="Toggle automatic notices delivery"
            disabled={isFormLocked}
          >
            <span></span>
          </button>
        </div>

        <footer>
          <Button variant="secondary" onClick={() => setIsEditing(true)} disabled={isLoading || isSaving || isEditing}>
            <Edit3 size={14} />
            Edit
          </Button>
          <Button variant="secondary" onClick={handleTestConnection} disabled={isLoading || isTesting || isSaving}>
            {isTesting ? <Loader2 size={14} className="icon-spin" /> : <Cable size={14} />}
            Test Connection
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
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveSettings} disabled={isLoading || isTesting || isSaving || !isEditing}>
            {isSaving ? <Loader2 size={14} className="icon-spin" /> : <Save size={14} />}
            Save Settings
          </Button>
        </footer>
      </section>

      <section className="whatsapp-card">
        <header className="status-head">
          <h3>
            <Bot size={15} />
            Groups and Feature Mapping
          </h3>
        </header>

        <div className="group-binding-row">
          <Button variant="secondary" onClick={handleSyncGroups} disabled={isLoading || isSyncingGroups || isSaving}>
            {isSyncingGroups ? <Loader2 size={14} className="icon-spin" /> : <RefreshCcw size={14} />}
            Sync Groups
          </Button>

          <label>
            <span>Group for notices</span>
            <select
              value={noticeGroupJid}
              onChange={(event) => setNoticeGroupJid(event.target.value)}
              disabled={isLoading || isSaving}
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.groupJid} value={group.groupJid}>
                  {group.groupName}
                </option>
              ))}
            </select>
          </label>

          <Button variant="primary" onClick={handleSaveNoticeBinding} disabled={isLoading || isSaving || !noticeGroupJid}>
            Save Group
          </Button>
        </div>
        {groupsError ? (
          <div className="group-sync-error">
            <strong>Could not sync groups.</strong>
            <p>{groupsError}</p>
            <p>Check Evolution API URL, API key, and if the instance is online.</p>
          </div>
        ) : null}

        {settings.noticeGroupJid ? (
          <p className="bound-group-hint">
            Current mapping: <strong>{settings.noticeGroupName || settings.noticeGroupJid}</strong>
          </p>
        ) : null}

        {activeNoticeGroup ? (
          <p className="bound-group-hint">
            Selected group: <strong>{activeNoticeGroup.groupName}</strong>
          </p>
        ) : null}
      </section>

      <section className="whatsapp-card">
        <header className="status-head">
          <h3>
            <Bot size={15} />
            Integration Status
          </h3>
        </header>

        <div className="status-list">
          <article>
            <div>
              <strong>Evolution API</strong>
              <p>Provider connectivity</p>
            </div>
            <span className={`status-indicator ${settings.status === "connected" ? "ok" : "off"}`}>
              <Power size={12} /> {providerStatusLabel}
            </span>
          </article>
          <article>
            <div>
              <strong>Notices Group</strong>
              <p>Destination group for organization notices</p>
            </div>
            <span className={`status-indicator ${settings.noticeGroupJid ? "ok" : "off"}`}>
              <Power size={12} /> {settings.noticeGroupJid ? "Mapped" : "Not mapped"}
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
