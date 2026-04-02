"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Bell, MessageCircle } from "lucide-react"
import { useCreateNotice } from "../../hooks/notice/useCreateNotice"
import { useNoticeConstraints } from "../../hooks/notice/useNoticeConstraints"
import { useToast } from "../../context/ToastContext"
import { Button } from "../"
import { fetchWithAuthHandling, getApiBaseUrl } from "../../utils/api"
import "./NoticeForm.css"
import { useLoading } from "../../context/LoadingContext"

interface NoticeFormProps {
  onNoticeCreated: () => void
  onCancel: () => void | Promise<void>
}

const NoticeForm: React.FC<NoticeFormProps> = ({ onNoticeCreated, onCancel }) => {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [content, setContent] = useState("")
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false)
  const [isLoadingWhatsappDefault, setIsLoadingWhatsappDefault] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const { createNotice, isLoading } = useCreateNotice()
  const { contentMaxLength } = useNoticeConstraints()
  const { showToast } = useToast()
  const { setIsLoading } = useLoading()
  const didSetDefaultRef = useRef(false)
  const didShowContentLimitToastRef = useRef(false)

  const handleContentChange = (nextContent: string) => {
    setContent(nextContent)

    const didReachLimit = nextContent.length >= contentMaxLength
    if (didReachLimit && !didShowContentLimitToastRef.current) {
      showToast("Limite de caracteres atingido.", "error")
      didShowContentLimitToastRef.current = true
      return
    }

    if (!didReachLimit) {
      didShowContentLimitToastRef.current = false
    }
  }

  useEffect(() => {
    const loadWhatsappDefault = async () => {
      try {
        const response = await fetchWithAuthHandling(`${getApiBaseUrl()}/whatsapp/settings`)
        if (!response.ok) return

        const payload = (await response.json()) as { autoSendNotices?: boolean }
        if (payload.autoSendNotices && !didSetDefaultRef.current) {
          setSendViaWhatsapp(true)
          didSetDefaultRef.current = true
        }
      } catch {
        // Keep default false when settings cannot be loaded.
      } finally {
        setIsLoadingWhatsappDefault(false)
      }
    }

    void loadWhatsappDefault()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      showToast("Preencha título e conteúdo para publicar o aviso.", "error")
      return
    }

    try {
      setIsLoading(true)
      const { success, error, data } = await createNotice({
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        sendViaWhatsapp,
      })

      if (success) {
        const status = (data as { whatsappDeliveryStatus?: string } | undefined)?.whatsappDeliveryStatus
        const failureReason = (data as { whatsappLastError?: string } | undefined)?.whatsappLastError

        if (sendViaWhatsapp && status && status !== "sent") {
          showToast(
            status === "failed"
              ? `Aviso publicado, mas o envio no WhatsApp falhou.${failureReason ? ` Motivo: ${failureReason}` : ""}`
              : "Aviso publicado, mas o envio no WhatsApp ficou pendente.",
            "error",
          )
        } else {
          showToast("Aviso publicado com sucesso.", "success")
        }
        onNoticeCreated()
      } else {
        console.error("Error creating notice:", error)
        showToast("Não foi possível publicar o aviso.", "error")
      }
    } catch (error) {
      console.error("Error creating notice:", error)
      showToast("Não foi possível publicar o aviso.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (isCancelling || isLoading) return

    try {
      setIsCancelling(true)
      await onCancel()
    } catch (error) {
      console.error("Error cancelling notice form:", error)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <form className="notice-compose-form" onSubmit={handleSubmit}>
      <header className="notice-compose-header">
        <Bell size={16} />
        <h3>Criar Novo Aviso</h3>
      </header>

      <div className="notice-compose-group">
        <label htmlFor="notice-title">Título</label>
        <input
          id="notice-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do aviso"
          required
          maxLength={100}
        />
      </div>

      <div className="notice-compose-group">
        <label htmlFor="notice-subtitle">Subtítulo (opcional)</label>
        <input
          id="notice-subtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtítulo do aviso"
          maxLength={200}
        />
      </div>

      <div className="notice-compose-group">
        <label htmlFor="notice-content">Conteúdo</label>
        <textarea
          id="notice-content"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Escreva o conteúdo do aviso..."
          required
          rows={5}
          maxLength={contentMaxLength}
        />
        {content.length >= contentMaxLength ? (
          <small className="notice-compose-limit-info">*Limite de {contentMaxLength} de caracteres atingido.</small>
        ) : null}
      </div>

      <div className="notice-compose-channel">
        <div className="notice-compose-channel-text">
          <MessageCircle size={16} />
          <div>
            <strong>Enviar via WhatsApp</strong>
            <p>Enviar notificação para todos os moradores</p>
          </div>
        </div>

        <label className="notice-compose-switch" aria-label="Enviar via WhatsApp">
          <input
            type="checkbox"
            checked={sendViaWhatsapp}
            onChange={(e) => setSendViaWhatsapp(e.target.checked)}
            disabled={isLoadingWhatsappDefault}
          />
          <span />
        </label>
      </div>

      <footer className="notice-compose-actions">
        <Button
          variant="secondary"
          type="button"
          onClick={handleCancel}
          isLoading={isCancelling}
          loadingText="Cancelando..."
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading || isCancelling}>
          Publicar Aviso
        </Button>
      </footer>
    </form>
  )
}

export default NoticeForm
