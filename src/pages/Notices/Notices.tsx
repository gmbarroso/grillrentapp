"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { NoticeBoard } from "../../components"
import { LoadingSpinner } from "../../components"
import { useAllNotices } from "../../hooks/notice/useAllNotices"
import { isNoticeUnread, useMarkNoticesAsSeen, useNoticeUnreadState } from "../../hooks/notice/useNoticeReadTracking"
import { useToast } from "../../context/ToastContext"
import { authError, sanitizeForLog } from "../../utils/auth-logger"
import "./Notices.css"

const UNREAD_ANIMATION_FADE_MS = 2000

const Notices = () => {
  const { token } = useAuth()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const hasMarkedSeenRef = useRef(false)
  const hasInitializedUnreadAnimationRef = useRef(false)
  const [unreadNoticeIdsForAnimation, setUnreadNoticeIdsForAnimation] = useState<Set<string>>(new Set())
  const [shouldFadeUnreadBadges, setShouldFadeUnreadBadges] = useState(false)

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
  const { isNoticeReadTrackingEnabled } = useNoticeUnreadState()
  const { markNoticesAsSeen } = useMarkNoticesAsSeen()

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

  useEffect(() => {
    if (!isNoticeReadTrackingEnabled) {
      return
    }
    if (isLoading) {
      return
    }
    if (hasMarkedSeenRef.current) {
      return
    }
    hasMarkedSeenRef.current = true

    const applyReadState = async () => {
      try {
        const markResult = await markNoticesAsSeen()
        if (!hasInitializedUnreadAnimationRef.current) {
          const unreadBeforeSeen = new Set(
            notices
              .filter((notice) => isNoticeUnread(notice.createdAt, markResult.previousLastSeenNoticesAt))
              .map((notice) => notice.id),
          )
          hasInitializedUnreadAnimationRef.current = true
          setUnreadNoticeIdsForAnimation(unreadBeforeSeen)
          if (unreadBeforeSeen.size > 0) {
            setShouldFadeUnreadBadges(true)
            window.setTimeout(() => {
              setUnreadNoticeIdsForAnimation(new Set())
              setShouldFadeUnreadBadges(false)
            }, UNREAD_ANIMATION_FADE_MS)
          }
        }
      } catch (error) {
        authError("[NoticesReadTracking] mark-seen failed", sanitizeForLog({ message: (error as Error)?.message }))
        showToast("Nao foi possivel atualizar leitura dos avisos. Tentaremos novamente depois.", "warning")
      }
    }

    void applyReadState()
  }, [isLoading, isNoticeReadTrackingEnabled, markNoticesAsSeen, notices, showToast])

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
          unreadNoticeIds={unreadNoticeIdsForAnimation}
          shouldFadeUnreadBadges={shouldFadeUnreadBadges}
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
