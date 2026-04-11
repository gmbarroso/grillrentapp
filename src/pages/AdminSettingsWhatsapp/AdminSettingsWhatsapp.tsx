import { AlertTriangle, Check, Loader2, MessageCircleMore, RefreshCcw, Undo2, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useOrganizationSettings } from "../../hooks/organization/useOrganizationSettings"
import { fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import { FALLBACK_QR_SECONDS, parseOnboardingState, parseQrSeconds, resolveSettingsStage, type OnboardingSnapshot, type OnboardingStage } from "./onboardingState"
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
  participantsCount?: number
}

type GroupSyncState = "idle" | "syncing" | "warning"

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

const normalizeApiPath = (value: string): string => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }
  const cleaned = value.startsWith("/") ? value : `/${value}`
  return `${API_BASE_URL}${cleaned}`
}

const asDataUrl = (value?: string | null): string | null => {
  if (!value || typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("data:image")) return trimmed
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `data:image/png;base64,${trimmed}`
}

const AdminSettingsWhatsapp = () => {
  const { showToast } = useToast()
  const { organization } = useOrganizationSettings()

  const [settings, setSettings] = useState<WhatsappSettingsView>(emptySettings)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [selectedGroupJid, setSelectedGroupJid] = useState("")

  const [stage, setStage] = useState<OnboardingStage>("bootstrapping")
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [isSyncingGroups, setIsSyncingGroups] = useState(false)
  const [isTogglingAutoSend, setIsTogglingAutoSend] = useState(false)
  const [isRefreshingQr, setIsRefreshingQr] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(FALLBACK_QR_SECONDS)
  const [statusEndpoint, setStatusEndpoint] = useState<string | null>(null)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)
  const [groupSyncState, setGroupSyncState] = useState<GroupSyncState>("idle")

  const activeGroup = useMemo(
    () => groups.find((group) => group.groupJid === (settings.noticeGroupJid || selectedGroupJid)) || null,
    [groups, selectedGroupJid, settings.noticeGroupJid],
  )
  const persistedGroupName = settings.noticeGroupName || settings.noticeGroupJid || null

  const fetchGroups = async () => {
    setIsSyncingGroups(true)
    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/groups`)
      if (!response.ok) {
        throw new Error(`Falha ao carregar grupos (${response.status})`)
      }

      const payload = (await response.json()) as GroupOption[]
      setGroups(payload)
      return payload
    } finally {
      setIsSyncingGroups(false)
    }
  }

  const loadSettings = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings`)
      if (!response.ok) {
        throw new Error(`Falha ao carregar configurações (${response.status})`)
      }

      const payload = (await response.json()) as WhatsappSettingsView
      setSettings(payload)
      setSelectedGroupJid(payload.noticeGroupJid || "")
      setShowDisconnectConfirm(false)

      if (payload.status === "connected") {
        setStage(resolveSettingsStage(payload.status, payload.noticeGroupJid))
        setGroupSyncState("syncing")
        let loadedGroups: GroupOption[] = []
        try {
          loadedGroups = await fetchGroups()
          setGroupSyncState("idle")
        } catch (groupsError) {
          console.error(handleApiError(groupsError, "/whatsapp/settings/groups"))
          showToast("Canal conectado, mas não foi possível sincronizar os grupos agora.", "error")
          setGroupSyncState("warning")
        }

        if (!payload.noticeGroupJid && loadedGroups.length === 1) {
          setSelectedGroupJid(loadedGroups[0].groupJid)
        }
      } else {
        setStage("idle")
        setGroups([])
        setGroupSyncState("idle")
      }

      setStageError(null)
      return true
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings"))
      setStage("failed")
      setStageError("Não foi possível carregar o estado da integração WhatsApp.")
      return false
    } finally {
      setIsLoading(false)
      setHasLoadedOnce(true)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  useEffect(() => {
    if (stage !== "qr_ready" && stage !== "connecting") return
    if (qrSecondsLeft <= 0) return

    const timeout = window.setTimeout(() => {
      setQrSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [stage, qrSecondsLeft])

  useEffect(() => {
    if ((stage !== "qr_ready" && stage !== "connecting") || !statusEndpoint) return

    let cancelled = false
    let timeout: number | undefined

    const scheduleNextPoll = () => {
      if (cancelled) return
      timeout = window.setTimeout(() => {
        void pollStatus()
      }, 2500)
    }

    const pollStatus = async () => {
      try {
        const response = await fetchWithAuthHandling(statusEndpoint)
        if (!response.ok || cancelled) return

        const payload = (await response.json()) as OnboardingSnapshot
        if (cancelled) return

        const parsedStage = parseOnboardingState(payload)
        if (parsedStage === "group_selection") {
          const loadedGroups = await fetchGroups()
          if (cancelled) return

          setStage("group_selection")
          if (loadedGroups.length === 1) {
            setSelectedGroupJid(loadedGroups[0].groupJid)
          }
          return
        }

        if (parsedStage === "active") {
          const success = await loadSettings()
          if (cancelled) return

          if (success) setStage("active")
          return
        }

        if (parsedStage === "connecting") {
          setStage("connecting")
          return
        }

        if (parsedStage === "failed") {
          setStage("failed")
          setStageError("A conexão foi encerrada. Gere um novo QR Code para continuar.")
          return
        }

        const maybeQr = asDataUrl(payload.qrCode || payload.qrCodeBase64 || payload.qrcode)
        if (maybeQr) {
          setQrCodeDataUrl(maybeQr)
          setQrSecondsLeft(parseQrSeconds(payload))
        }
      } catch {
        // ignore transient errors
      } finally {
        scheduleNextPoll()
      }
    }

    void pollStatus()

    return () => {
      cancelled = true
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
      }
    }
  }, [stage, statusEndpoint])

  const beginOnboarding = async () => {
    setStageError(null)
    setShowDisconnectConfirm(false)
    setIsStarting(true)
    setStage("creating_instance")

    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/onboarding/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        throw new Error(`Falha ao iniciar onboarding (${response.status})`)
      }
      const payload = (await response.json()) as OnboardingSnapshot

      setStatusEndpoint(payload.statusEndpoint ? normalizeApiPath(payload.statusEndpoint) : `${API_BASE_URL}/whatsapp/settings/onboarding/status`)
      const parsedStage = parseOnboardingState(payload)
      const parsedQr = asDataUrl(payload.qrCode || payload.qrCodeBase64 || payload.qrcode)

      if (parsedQr) {
        setQrCodeDataUrl(parsedQr)
        setQrSecondsLeft(parseQrSeconds(payload))
      }

      if (parsedStage === "group_selection") {
        const loadedGroups = await fetchGroups()
        setStage("group_selection")
        if (loadedGroups.length === 1) {
          setSelectedGroupJid(loadedGroups[0].groupJid)
        }
      } else {
        setStage(parsedStage || "qr_ready")
      }
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/onboarding/start"))
      setStage("failed")
      setStageError("Falha ao iniciar conexão do WhatsApp. Tente novamente.")
    } finally {
      setIsStarting(false)
    }
  }

  const refreshQr = async () => {
    setIsRefreshingQr(true)
    setStageError(null)
    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/onboarding/refresh-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        throw new Error(`Falha ao atualizar QR (${response.status})`)
      }
      const payload = (await response.json()) as OnboardingSnapshot

      const parsedQr = asDataUrl(payload.qrCode || payload.qrCodeBase64 || payload.qrcode)
      if (parsedQr) {
        setQrCodeDataUrl(parsedQr)
      }
      setQrSecondsLeft(parseQrSeconds(payload))
      const parsedStage = parseOnboardingState(payload)
      setStage(parsedStage || "qr_ready")
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/onboarding/refresh-qr"))
      setStageError("Não foi possível atualizar o QR Code agora.")
    } finally {
      setIsRefreshingQr(false)
    }
  }

  const saveGroupSelection = async () => {
    if (!selectedGroupJid) return

    const selectedGroup = groups.find((group) => group.groupJid === selectedGroupJid)
    setIsSavingGroup(true)
    setStageError(null)

    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/bindings/notices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupJid: selectedGroupJid,
          groupName: selectedGroup?.groupName || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao salvar grupo (${response.status})`)
      }

      showToast("Grupo de avisos configurado com sucesso.", "success")
      await loadSettings()
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/bindings/notices"))
      setStageError("Não foi possível salvar o grupo selecionado.")
      setStage("failed")
    } finally {
      setIsSavingGroup(false)
    }
  }

  const toggleAutoSend = async () => {
    setIsTogglingAutoSend(true)
    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: settings.baseUrl,
          instanceName: settings.instanceName,
          whatsappNumber: settings.whatsappNumber,
          autoSendNotices: !settings.autoSendNotices,
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao atualizar envio automático (${response.status})`)
      }

      const payload = (await response.json()) as WhatsappSettingsView
      setSettings(payload)
      showToast(payload.autoSendNotices ? "Envio automático ativado." : "Envio automático desativado.", "success")
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings"))
      showToast("Não foi possível atualizar o envio automático.", "error")
    } finally {
      setIsTogglingAutoSend(false)
    }
  }

  const disconnectChannel = async () => {
    setIsDisconnecting(true)
    setStageError(null)

    try {
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/whatsapp/settings/onboarding/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        throw new Error(`Falha ao desconectar (${response.status})`)
      }

      showToast("WhatsApp desconectado com sucesso.", "success")
      setQrCodeDataUrl(null)
      setStatusEndpoint(null)
      setGroups([])
      setSelectedGroupJid("")
      await loadSettings()
    } catch (error) {
      console.error(handleApiError(error, "/whatsapp/settings/onboarding/disconnect"))
      setStageError("Não foi possível desconectar o canal agora.")
    } finally {
      setIsDisconnecting(false)
      setShowDisconnectConfirm(false)
    }
  }

  const statusBadgeClass =
    groupSyncState === "syncing" || groupSyncState === "warning" ? "wa-status-badge warning" : "wa-status-badge"
  const statusBadgeLabel = groupSyncState === "syncing" ? "Sincronizando..." : groupSyncState === "warning" ? "Atenção" : "Ativo"
  const isInitialLoading = isLoading && !hasLoadedOnce && stage === "bootstrapping"

  return (
    <div className="admin-whatsapp-page">
      <Link to="/admin/settings" className="settings-back-link">
        <Undo2 size={14} />
        Configurações
      </Link>

      <header className="admin-page-heading">
        <h2>Integração WhatsApp</h2>
        <p>Conecte um grupo do WhatsApp para enviar avisos diretamente aos moradores.</p>
      </header>

      <section className="wa-flow-card">
        {isInitialLoading ? (
          <div className="wa-center-state">
            <span className="wa-loading-icon"><Loader2 size={26} /></span>
            <h3>Carregando integração...</h3>
            <p className="wa-muted">Isso pode levar alguns segundos enquanto buscamos os grupos.</p>
          </div>
        ) : null}

        {!isInitialLoading && (stage === "idle" || stage === "failed") && (
          <>
            <div className="wa-empty-icon-wrap">
              <span className="wa-empty-icon"><MessageCircleMore size={30} /></span>
            </div>
            <h3>Nenhum canal conectado</h3>
            <p className="wa-muted">Conecte um grupo do WhatsApp para enviar avisos automaticamente aos moradores do condomínio.</p>

            <div className="wa-steps-box" role="list" aria-label="Passos para conectar WhatsApp">
              <p><span>1</span> Clique em Conectar WhatsApp</p>
              <p><span>2</span> Escaneie o QR code com seu celular</p>
              <p><span>3</span> Selecione o grupo dos moradores</p>
              <p><span>4</span> Pronto! Comece a enviar avisos</p>
            </div>

            {stageError ? <p className="wa-error-inline">{stageError}</p> : null}

            <Button variant="primary" onClick={beginOnboarding} isLoading={isStarting} loadingText="Preparando conexão..." fullWidth>
              Conectar WhatsApp
            </Button>

            {organization?.slug ? (
              <p className="wa-helper-text">
                Instância gerada automaticamente a partir do slug da organização: <strong>{organization.slug}</strong>
              </p>
            ) : null}
          </>
        )}

        {!isInitialLoading && (stage === "creating_instance" || stage === "connecting") && (
          <div className="wa-center-state">
            <span className="wa-loading-icon"><Loader2 size={26} /></span>
            <h3>{stage === "creating_instance" ? "Preparando conexão..." : "Conectando WhatsApp..."}</h3>
            <p className="wa-muted">Estamos preparando sua instância e aguardando o estado da conexão.</p>
          </div>
        )}

        {!isInitialLoading && stage === "qr_ready" && (
          <>
            <div className="wa-center-state">
              <h3>Escaneie o QR Code</h3>
              <p className="wa-muted">Abra o WhatsApp &gt; Dispositivos conectados &gt; Conectar dispositivo</p>
            </div>

            <div className="wa-qr-wrap">
              {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="QR Code para conectar WhatsApp" /> : <div className="wa-qr-placeholder">QR</div>}
            </div>

            <p className="wa-qr-status">
              <span className="wa-dot" />
              Aguardando leitura... expira em <strong>{qrSecondsLeft}s</strong>
            </p>

            <div className="wa-qr-actions">
              <Button variant="secondary" onClick={refreshQr} isLoading={isRefreshingQr} loadingText="Atualizando QR..." fullWidth>
                <RefreshCcw size={14} />
                Atualizar QR
              </Button>
            </div>

            <Button
              type="button"
              variant="link"
              className="wa-link-button"
              onClick={() => {
                setStage("idle")
                setStageError(null)
              }}
            >
              Cancelar
            </Button>

            {stageError ? <p className="wa-error-inline">{stageError}</p> : null}
          </>
        )}

        {!isInitialLoading && stage === "group_selection" && (
          <>
            <div className="wa-connected-title">
              <span><Check size={14} /></span>
              <div>
                <h3>WhatsApp conectado!</h3>
                <p className="wa-muted">Agora selecione o(s) grupo(s) que receberão os avisos do condomínio.</p>
              </div>
            </div>

            {isSyncingGroups ? (
              <div className="wa-loading-row"><Loader2 size={16} /> Carregando grupos...</div>
            ) : groups.length === 0 ? (
              <>
                <div className="wa-empty-groups">
                  <AlertTriangle size={14} />
                  Nenhum grupo encontrado. Verifique se o WhatsApp está conectado e tente novamente.
                </div>
                <Button variant="secondary" onClick={() => void fetchGroups()} isLoading={isSyncingGroups} fullWidth>
                  <RefreshCcw size={14} />
                  Tentar novamente
                </Button>
              </>
            ) : (
              <div className="wa-group-list" role="radiogroup" aria-label="Selecionar grupo de avisos">
                {groups.map((group) => {
                  const isSelected = selectedGroupJid === group.groupJid
                  return (
                    <button
                      key={group.groupJid}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`wa-group-option ${isSelected ? "selected" : ""}`.trim()}
                      onClick={() => setSelectedGroupJid(group.groupJid)}
                    >
                      <span className="wa-group-icon"><Users size={17} /></span>
                      <span className="wa-group-meta">
                        <strong>{group.groupName}</strong>
                        <small>{group.participantsCount ? `${group.participantsCount} membros` : "Grupo"}</small>
                      </span>
                      <span className={`wa-radio ${isSelected ? "checked" : ""}`.trim()} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            )}

            <Button
              variant="primary"
              onClick={saveGroupSelection}
              disabled={!selectedGroupJid || isSyncingGroups}
              isLoading={isSavingGroup}
              loadingText="Salvando grupo..."
              fullWidth
            >
              Confirmar{selectedGroupJid ? " (1 grupo)" : ""}
            </Button>

            <Button type="button" variant="link" className="wa-link-button" onClick={() => void loadSettings()}>
              Cancelar
            </Button>
          </>
        )}

        {!isInitialLoading && stage === "active" && (
          <>
            <article className="wa-status-card">
              <div className="wa-status-head">
                <span className="wa-group-icon"><MessageCircleMore size={18} /></span>
                <div>
                  <strong>Canal conectado</strong>
                  <small>{settings.noticeGroupJid ? "1 grupo selecionado" : "0 grupos selecionados"}</small>
                </div>
                <span className={statusBadgeClass}>
                  {groupSyncState === "syncing" ? <Loader2 size={12} /> : null}
                  {statusBadgeLabel}
                </span>
              </div>
            </article>

            <article className="wa-block-card">
              <header>
                <Users size={15} />
                <strong>Grupos configurados</strong>
              </header>
              {activeGroup ? (
                <div className="wa-group-active-row">
                  <span className="wa-group-icon"><Users size={16} /></span>
                  <strong>{activeGroup.groupName}</strong>
                  <small>{activeGroup.participantsCount ? `${activeGroup.participantsCount} membros` : "Grupo principal"}</small>
                </div>
              ) : persistedGroupName ? (
                <div className="wa-group-active-row">
                  <span className="wa-group-icon"><Users size={16} /></span>
                  <strong>{persistedGroupName}</strong>
                  <small>Grupo principal (persistido)</small>
                </div>
              ) : (
                <p className="wa-muted">Nenhum grupo configurado para avisos.</p>
              )}
            </article>

            <article className="wa-block-card">
              <header>
                <MessageCircleMore size={15} />
                <strong>Envio Automático</strong>
              </header>
              <div className="wa-switch-row">
                <p className="wa-muted">App + WhatsApp</p>
                <button
                  type="button"
                  className={`switch ${settings.autoSendNotices ? "on" : ""}`.trim()}
                  onClick={toggleAutoSend}
                  disabled={isTogglingAutoSend}
                  aria-label="Alternar envio automático"
                >
                  <span></span>
                </button>
              </div>
            </article>

            <hr className="wa-separator" />

            {!showDisconnectConfirm ? (
              <Button type="button" variant="link" className="wa-danger-link" onClick={() => setShowDisconnectConfirm(true)}>
                Desconectar WhatsApp
              </Button>
            ) : (
              <div className="wa-disconnect-confirm">
                <h4>
                  <AlertTriangle size={15} />
                  Tem certeza que deseja desconectar?
                </h4>
                <p>Os moradores deixarão de receber avisos via WhatsApp até uma nova conexão ser estabelecida.</p>
                <div className="wa-confirm-actions">
                  <Button variant="secondary" onClick={() => setShowDisconnectConfirm(false)}>
                    Cancelar
                  </Button>
                  <Button variant="danger" onClick={disconnectChannel} isLoading={isDisconnecting} loadingText="Desconectando...">
                    Desconectar
                  </Button>
                </div>
              </div>
            )}

            {stageError ? <p className="wa-error-inline">{stageError}</p> : null}
            {groupSyncState === "warning" ? (
              <p className="wa-warning-inline">Os grupos podem estar desatualizados. Tente novamente em instantes.</p>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}

export default AdminSettingsWhatsapp
