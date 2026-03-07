import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import NoticeForm from "../../components/NoticeForm/NoticeForm"
import { Button, LoadingSpinner, NoticeBoard } from "../../components"
import { useAllNotices } from "../../hooks/notice/useAllNotices"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import "./AdminNotices.css"

const AdminNotices = () => {
  const { token } = useAuth()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const {
    notices,
    currentPage,
    lastPage,
    currentLimit,
    isLoading,
    isError,
    changePage,
    changeLimit,
    refreshNotices,
  } = useAllNotices(token ?? "")

  const sortedNotices = useMemo(
    () => [...notices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notices],
  )

  const handleNoticeDeleted = useCallback(async () => {
    await refreshNotices()
    showToast(t("NoticeBoard.DeleteSuccess"), "success")
  }, [refreshNotices, showToast, t])

  const handleNoticeCreated = useCallback(async () => {
    await refreshNotices()
    setShowCreateForm(false)
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
    <div className="admin-notices-page">
      <header className="admin-page-heading with-action">
        <div>
          <h2>Avisos</h2>
          <p>Crie e gerencie avisos para os moradores</p>
        </div>

        <Button variant="primary" onClick={() => setShowCreateForm((prev) => !prev)}>
          <Plus size={14} />
          Novo Aviso
        </Button>
      </header>

      {showCreateForm ? (
        <div className="admin-notice-form-wrap">
          <NoticeForm onNoticeCreated={handleNoticeCreated} />
        </div>
      ) : null}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <NoticeBoard
          notices={sortedNotices}
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

export default AdminNotices
