"use client"

import { useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { NoticeBoard } from "../../components"
import NoticeForm from "../../components/NoticeForm/NoticeForm"
import { LoadingSpinner } from "../../components"
import { useAllNotices } from "../../hooks/notice/useAllNotices"
import { useToast } from "../../context/ToastContext"
import "./Notices.css"

const Notices = () => {
  const { user, token } = useAuth()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const isAdmin = user?.role === "admin"

  const {
    notices,
    currentPage,
    lastPage,
    isLoading,
    isError,
    currentLimit,
    changePage,
    changeLimit,
    refreshNotices,
  } = useAllNotices(token ?? "")

  const handleNoticeDeleted = useCallback(
    async (noticeId: string) => {
      await refreshNotices()
      showToast(t("NoticeBoard.DeleteSuccess"), "success")
    },
    [refreshNotices, showToast, t],
  )

  const handleNoticeCreated = useCallback(async () => {
    await refreshNotices()
    showToast(t("NoticeForm.CreateSuccess"), "success")
  }, [refreshNotices, showToast, t])

  const handleNoticeUpdated = useCallback(async () => {
    await refreshNotices()
    showToast(t("NoticeForm.UpdateSuccess"), "success")
  }, [refreshNotices, showToast, t])

  useEffect(() => {
    if (isError) {
      showToast(t("NoticeBoard.ErrorLoading"), "error")
    }
  }, [isError, showToast, t])

  return (
    <div className="notices-page">
      <header className="notices-page-header">
        <h1>Avisos do Condominio</h1>
        <p>Fique por dentro das novidades e comunicados</p>
      </header>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <NoticeBoard
          notices={notices}
          currentPage={currentPage}
          lastPage={lastPage}
          currentLimit={currentLimit}
          onNoticeDeleted={handleNoticeDeleted}
          onNoticeUpdated={handleNoticeUpdated}
          onChangePage={changePage}
          onChangeLimit={changeLimit}
        />
      )}
    </div>
  )
}

export default Notices
