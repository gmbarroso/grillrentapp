"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useDeleteNotice } from "../../hooks/notice/useDeleteNotice"
import { Modal } from "../"
import { useToast } from "../../context/ToastContext"
import { Trash2, Edit } from "lucide-react"
import EditNoticeForm from "../NoticeForm/EditNoticeForm"
import "./NoticeBoard.css"
import type { Notice } from "../../types/Notice"
import { useLoading } from "../../context/LoadingContext"

interface NoticeBoardProps {
  notices: Notice[]
  total: number
  currentPage: number
  lastPage: number
  currentLimit: number
  currentSort: string
  currentOrder: "ASC" | "DESC"
  onNoticeDeleted: (noticeId: string) => void
  onNoticeUpdated: () => void
  onChangePage: (page: number) => void
  onChangeLimit: (limit: number) => void
  onChangeSort: (sort: string) => void
  onChangeOrder: (order: "ASC" | "DESC") => void
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({
  notices,
  total,
  currentPage,
  lastPage,
  currentLimit,
  currentSort,
  currentOrder,
  onNoticeDeleted,
  onNoticeUpdated,
  onChangePage,
  onChangeLimit,
  onChangeSort,
  onChangeOrder,
}) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { deleteNotice } = useDeleteNotice()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const { showToast } = useToast()
  const { setIsLoading } = useLoading()

  const handleDeleteClick = (noticeId: string) => {
    setSelectedNoticeId(noticeId)
    setIsModalOpen(true)
  }

  const handleEditClick = (notice: Notice) => {
    setEditingNotice(notice)
  }

  const handleCancelEdit = () => {
    setEditingNotice(null)
  }

  const handleConfirmDelete = useCallback(async () => {
    if (selectedNoticeId) {
      try {
        setIsLoading(true)
        const { success, error } = await deleteNotice(selectedNoticeId)

        if (success) {
          onNoticeDeleted(selectedNoticeId)
        } else {
          console.error("Error deleting notice:", error)
          showToast(t("NoticeBoard.DeleteError"), "error")
        }
      } catch (error) {
        console.error("Error deleting notice:", error)
        showToast(t("NoticeBoard.DeleteError"), "error")
      } finally {
        setIsLoading(false)
        setIsModalOpen(false)
        setSelectedNoticeId(null)
      }
    } else {
      setIsModalOpen(false)
      setSelectedNoticeId(null)
    }
  }, [selectedNoticeId, deleteNotice, onNoticeDeleted, showToast, t, setIsLoading])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedNoticeId(null)
  }, [])

  const handleSortChange = (column: string) => {
    if (currentSort === column) {
      onChangeOrder(currentOrder === "ASC" ? "DESC" : "ASC")
    } else {
      onChangeSort(column)
      onChangeOrder("DESC")
    }
  }

  const isAdmin = user?.role === "admin"

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (editingNotice) {
    return (
      <EditNoticeForm
        notice={editingNotice}
        onNoticeUpdated={() => {
          setEditingNotice(null)
          onNoticeUpdated()
        }}
        onCancel={handleCancelEdit}
      />
    )
  }

  return (
    <div className="notice-board">
      {notices.length === 0 ? (
        <div className="no-notices-message">{t("NoticeBoard.NoNotices")}</div>
      ) : (
        <>
          <div className="notices-container">
            {notices.map((notice) => (
              <div key={notice.id} className="notice-item">
                <div className="notice-header">
                  <h4 className="notice-title">{notice.title}</h4>
                  {isAdmin && (
                    <div className="notice-actions">
                      <button
                        onClick={() => handleEditClick(notice)}
                        className="edit-button"
                        aria-label={t("NoticeBoard.Edit")}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(notice.id)}
                        className="delete-button"
                        aria-label={t("NoticeBoard.Delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="notice-subtitle">{notice.subtitle}</div>
                <div className="notice-content">{notice.content}</div>
                <div className="notice-footer">
                  <span className="notice-author">{notice.authorName}</span>
                  <span className="notice-date">{formatDate(notice.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button onClick={() => onChangePage(currentPage - 1)} disabled={currentPage === 1}>
              {t("NoticeBoard.PreviousPage")}
            </button>
            <span>{t("NoticeBoard.PageInfo", { current: currentPage, total: lastPage })}</span>
            <button onClick={() => onChangePage(currentPage + 1)} disabled={currentPage === lastPage}>
              {t("NoticeBoard.NextPage")}
            </button>
            <select value={currentLimit} onChange={(e) => onChangeLimit(Number(e.target.value))}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </>
      )}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2>{t("NoticeBoard.ConfirmDeleteTitle")}</h2>
        <p>{t("NoticeBoard.ConfirmDeleteMessage")}</p>
        <div className="modal-actions">
          <button onClick={handleConfirmDelete} className="confirm-delete-button">
            {t("NoticeBoard.ConfirmDelete")}
          </button>
          <button onClick={handleCloseModal} className="cancel-button">
            {t("NoticeBoard.CancelDelete")}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default NoticeBoard

