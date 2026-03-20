import type { Notice } from "../../types"
import "./NoticePreviewItem.css"

interface NoticePreviewItemProps {
  notice: Notice
}

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" })

export default function NoticePreviewItem({ notice }: NoticePreviewItemProps) {
  return (
    <article className="notice-preview-item">
      <div className="notice-preview-header">
        <h4>{notice.title}</h4>
        <time>{shortDate.format(new Date(notice.createdAt))}</time>
      </div>
      <p className="notice-preview-subtitle">{notice.subtitle}</p>
      <p className="notice-preview-content">{notice.content}</p>
    </article>
  )
}
