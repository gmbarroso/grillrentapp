"use client"

import type React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useCreateNotice } from "../../hooks/notice/useCreateNotice"
import { useToast } from "../../context/ToastContext"
import "./NoticeForm.css"
import { useLoading } from "../../context/LoadingContext"

interface NoticeFormProps {
  onNoticeCreated: () => void
}

const NoticeForm: React.FC<NoticeFormProps> = ({ onNoticeCreated }) => {
  const { t } = useTranslation()
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [content, setContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const { createNotice, isLoading } = useCreateNotice()
  const { showToast } = useToast()
  const { setIsLoading } = useLoading()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      showToast(t("NoticeForm.ValidationError"), "error")
      return
    }

    try {
      setIsLoading(true)
      const { success, error } = await createNotice({ title, subtitle, content })

      if (success) {
        showToast(t("NoticeForm.CreateSuccess"), "success")
        setTitle("")
        setSubtitle("")
        setContent("")
        setIsExpanded(false)
        onNoticeCreated()
      } else {
        console.error("Error creating notice:", error)
        showToast(t("NoticeForm.CreateError"), "error")
      }
    } catch (error) {
      console.error("Error creating notice:", error)
      showToast(t("NoticeForm.CreateError"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="notice-form-container">
      {!isExpanded ? (
        <button className="expand-form-button" onClick={() => setIsExpanded(true)}>
          {t("NoticeForm.CreateNew")}
        </button>
      ) : (
        <form className="notice-form" onSubmit={handleSubmit}>
          <h3>{t("NoticeForm.Title")}</h3>
          <div className="form-group">
            <label htmlFor="notice-title">{t("NoticeForm.TitleLabel")}</label>
            <input
              id="notice-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("NoticeForm.TitlePlaceholder")}
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label htmlFor="notice-subtitle">{t("NoticeForm.SubtitleLabel")}</label>
            <input
              id="notice-subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={t("NoticeForm.SubtitlePlaceholder")}
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label htmlFor="notice-content">{t("NoticeForm.ContentLabel")}</label>
            <textarea
              id="notice-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("NoticeForm.ContentPlaceholder")}
              required
              rows={5}
              maxLength={2000}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => setIsExpanded(false)}>
              {t("NoticeForm.Cancel")}
            </button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? t("NoticeForm.Creating") : t("NoticeForm.Create")}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default NoticeForm

