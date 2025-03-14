"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useUpdateNotice } from "../../hooks/notice/useUpdateNotice"
import { useToast } from "../../context/ToastContext"
import type { Notice } from "../../types/Notice"
import "./NoticeForm.css"
import { useLoading } from "../../context/LoadingContext"

interface EditNoticeFormProps {
  notice: Notice
  onNoticeUpdated: () => void
  onCancel: () => void
}

const EditNoticeForm: React.FC<EditNoticeFormProps> = ({ notice, onNoticeUpdated, onCancel }) => {
  const { t } = useTranslation()
  const [title, setTitle] = useState(notice.title)
  const [subtitle, setSubtitle] = useState(notice.subtitle)
  const [content, setContent] = useState(notice.content)
  const { updateNotice, isLoading } = useUpdateNotice()
  const { showToast } = useToast()
  const { setIsLoading } = useLoading()

  useEffect(() => {
    setTitle(notice.title)
    setSubtitle(notice.subtitle)
    setContent(notice.content)
  }, [notice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      showToast(t("NoticeForm.ValidationError"), "error")
      return
    }

    try {
      setIsLoading(true)
      const { success, error } = await updateNotice(notice.id, { title, subtitle, content })

      if (success) {
        showToast(t("NoticeForm.UpdateSuccess"), "success")
        onNoticeUpdated()
      } else {
        console.error("Error updating notice:", error)
        showToast(t("NoticeForm.UpdateError"), "error")
      }
    } catch (error) {
      console.error("Error updating notice:", error)
      showToast(t("NoticeForm.UpdateError"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="notice-form-container">
      <form className="notice-form" onSubmit={handleSubmit}>
        <h3>{t("NoticeForm.EditTitle")}</h3>
        <div className="form-group">
          <label htmlFor="edit-notice-title">{t("NoticeForm.TitleLabel")}</label>
          <input
            id="edit-notice-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("NoticeForm.TitlePlaceholder")}
            required
            maxLength={100}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-notice-subtitle">{t("NoticeForm.SubtitleLabel")}</label>
          <input
            id="edit-notice-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={t("NoticeForm.SubtitlePlaceholder")}
            maxLength={200}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-notice-content">{t("NoticeForm.ContentLabel")}</label>
          <textarea
            id="edit-notice-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("NoticeForm.ContentPlaceholder")}
            required
            rows={5}
            maxLength={2000}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            {t("NoticeForm.Cancel")}
          </button>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? t("NoticeForm.Updating") : t("NoticeForm.Update")}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditNoticeForm

