"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Bell, MessageCircle } from "lucide-react"
import { useCreateNotice } from "../../hooks/notice/useCreateNotice"
import { useToast } from "../../context/ToastContext"
import { Button } from "../"
import { fetchWithAuthHandling, getApiBaseUrl } from "../../utils/api"
import "./NoticeForm.css"
import { useLoading } from "../../context/LoadingContext"

interface NoticeFormProps {
  onNoticeCreated: () => void
  onCancel: () => void
}

const NoticeForm: React.FC<NoticeFormProps> = ({ onNoticeCreated, onCancel }) => {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [content, setContent] = useState("")
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false)
  const [isLoadingWhatsappDefault, setIsLoadingWhatsappDefault] = useState(true)
  const { createNotice, isLoading } = useCreateNotice()
  const { showToast } = useToast()
  const { setIsLoading } = useLoading()
  const didSetDefaultRef = useRef(false)

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
      showToast("Preencha titulo e conteudo para publicar o aviso.", "error")
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
        showToast("Nao foi possivel publicar o aviso.", "error")
      }
    } catch (error) {
      console.error("Error creating notice:", error)
      showToast("Nao foi possivel publicar o aviso.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="notice-compose-form" onSubmit={handleSubmit}>
      <header className="notice-compose-header">
        <Bell size={16} />
        <h3>Criar Novo Aviso</h3>
      </header>

      <div className="notice-compose-group">
        <label htmlFor="notice-title">Titulo</label>
        <input
          id="notice-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titulo do aviso"
          required
          maxLength={100}
        />
      </div>

      <div className="notice-compose-group">
        <label htmlFor="notice-subtitle">Subtitulo (opcional)</label>
        <input
          id="notice-subtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitulo do aviso"
          maxLength={200}
        />
      </div>

      <div className="notice-compose-group">
        <label htmlFor="notice-content">Conteudo</label>
        <textarea
          id="notice-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva o conteudo do aviso..."
          required
          rows={5}
          maxLength={2000}
        />
      </div>

      <div className="notice-compose-channel">
        <div className="notice-compose-channel-text">
          <MessageCircle size={16} />
          <div>
            <strong>Enviar via WhatsApp</strong>
            <p>Enviar notificacao para todos os moradores</p>
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
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading}>
          Publicar Aviso
        </Button>
      </footer>
    </form>
  )
}

export default NoticeForm
