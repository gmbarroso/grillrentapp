import { useEffect, useMemo, useState } from "react"
import type { Notice } from "../../types/Notice"
import "./NoticeCarousel.css"

interface NoticeCarouselProps {
  notices: Notice[]
}

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" })

export default function NoticeCarousel({ notices }: NoticeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasManyNotices = notices.length > 1

  useEffect(() => {
    setActiveIndex(0)
  }, [notices.length])

  useEffect(() => {
    if (!hasManyNotices) return

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % notices.length)
    }, 6000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasManyNotices, notices.length])

  const activeNotice = useMemo(() => notices[activeIndex], [activeIndex, notices])

  if (!activeNotice) {
    return null
  }

  const changeNotice = (nextIndex: number) => {
    if (nextIndex < 0) {
      setActiveIndex(notices.length - 1)
      return
    }

    if (nextIndex >= notices.length) {
      setActiveIndex(0)
      return
    }

    setActiveIndex(nextIndex)
  }

  return (
    <article className="notice-carousel-card">
      <header className="notice-carousel-header">
        <h4>{activeNotice.title}</h4>
        <time>{shortDateFormatter.format(new Date(activeNotice.createdAt))}</time>
      </header>

      <p className="notice-carousel-subtitle">{activeNotice.subtitle}</p>
      <p className="notice-carousel-content">{activeNotice.content}</p>

      {hasManyNotices ? (
        <footer className="notice-carousel-footer">
          <div className="notice-carousel-actions">
            <button type="button" onClick={() => changeNotice(activeIndex - 1)} aria-label="Aviso anterior">
              ←
            </button>
            <button type="button" onClick={() => changeNotice(activeIndex + 1)} aria-label="Proximo aviso">
              →
            </button>
          </div>

          <div className="notice-carousel-dots" aria-label="Seletor de avisos">
            {notices.map((notice, index) => (
              <button
                key={notice.id}
                type="button"
                className={`notice-carousel-dot ${index === activeIndex ? "active" : ""}`.trim()}
                onClick={() => setActiveIndex(index)}
                aria-label={`Ir para aviso ${index + 1}`}
              />
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  )
}
