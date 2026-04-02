"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { useUpdateNotice } from "../../hooks/notice/useUpdateNotice"
import { useNoticeConstraints } from "../../hooks/notice/useNoticeConstraints"
import { useToast } from "../../context/ToastContext"
import { Button } from "../"
import type { Notice } from "../../types"
import "./NoticeForm.css"
import { useLoading } from "../../context/LoadingContext"

interface EditNoticeFormProps {
  notice: Notice
  onNoticeUpdated: () => void
  onCancel: () => void | Promise<void>
}

const EditNoticeForm: React.FC<EditNoticeFormProps> = ({ notice, onNoticeUpdated, onCancel }) => {
  const [title, setTitle] = useState(notice.title)
  const [subtitle, setSubtitle] = useState(notice.subtitle)
  const [content, setContent] = useState(notice.content)
  const [isCancelling, setIsCancelling] = useState(false)
  const { updateNotice, isLoading } = useUpdateNotice()
  const { contentMaxLength } = useNoticeConstraints()
  const { showToast } = useToast()
  const { setIsLoading } = useLoading()
  const didShowContentLimitToastRef = useRef(false)

  useEffect(() => {
    setTitle(notice.title)
    setSubtitle(notice.subtitle)
    setContent(notice.content)
    didShowContentLimitToastRef.current = false
  }, [notice])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      showToast("Preencha título e conteúdo para atualizar o aviso.", "error")
      return
    }

    try {
      setIsLoading(true)
      const { success, error } = await updateNotice(notice.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
      })

      if (success) {
        showToast("Aviso atualizado com sucesso.", "success")
        onNoticeUpdated()
      } else {
        console.error("Error updating notice:", error)
        showToast("Não foi possível atualizar o aviso.", "error")
      }
    } catch (error) {
      console.error("Error updating notice:", error)
      showToast("Não foi possível atualizar o aviso.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (isCancelling || isLoading) return

    try {
      setIsCancelling(true)
      await onCancel()
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <form className="notice-compose-form" onSubmit={handleSubmit}>
      <header className="notice-compose-header">
        <Bell size={16} />
        <h3>Editar Aviso</h3>
      </header>

      <div className="notice-compose-group">
        <label htmlFor="edit-notice-title">Título</label>
        <input
          id="edit-notice-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do aviso"
          required
          maxLength={100}
        />
      </div>

      <div className="notice-compose-group">
        <label htmlFor="edit-notice-subtitle">Subtítulo (opcional)</label>
        <input
          id="edit-notice-subtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtítulo do aviso"
          maxLength={200}
        />
      </div>

      <div className="notice-compose-group">
        <label htmlFor="edit-notice-content">Conteúdo</label>
        <textarea
          id="edit-notice-content"
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
          Atualizar Aviso
        </Button>
      </footer>
    </form>
  )
}

export default EditNoticeForm
