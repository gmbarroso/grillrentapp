import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, MessageCircleWarning, Lightbulb, CircleHelp, Trash2 } from "lucide-react"
import { Button, Modal, PaginationControls, Skeleton } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useAdminMessages } from "../../hooks/message/useMessages"
import type { ContactMessageCategory, Message, MessageReply } from "../../types"
import "./AdminMessages.css"

const categoryOptions: Array<{ value: ContactMessageCategory | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "suggestion", label: "Sugestões" },
  { value: "complaint", label: "Reclamações" },
  { value: "question", label: "Dúvidas" },
]

function categoryLabel(category: ContactMessageCategory): string {
  if (category === "complaint") return "Reclamação"
  if (category === "question") return "Dúvida"
  return "Sugestão"
}

function categoryIcon(category: ContactMessageCategory) {
  if (category === "complaint") return <MessageCircleWarning size={13} />
  if (category === "question") return <CircleHelp size={13} />
  return <Lightbulb size={13} />
}

function replyEmailLabel(reply: MessageReply): string {
  if (!reply.sendViaEmail) return "Não enviado por e-mail"
  if (reply.emailDeliveryStatus === "sent") return "E-mail enviado"
  if (reply.emailDeliveryStatus === "failed") return "Falha no e-mail"
  if (reply.emailDeliveryStatus === "pending") return "E-mail pendente"
  if (reply.emailDeliveryStatus === "skipped") return "E-mail ignorado"
  return "E-mail não solicitado"
}

function replyOriginLabel(reply: MessageReply): string {
  if (reply.originRole === "admin") return "Administração (app)"
  if (reply.originChannel === "email_inbound") return "Morador (email)"
  return "Morador (app)"
}

export default function AdminMessages() {
  const { showToast } = useToast()
  const {
    messages,
    total,
    isLoading,
    category,
    page,
    lastPage,
    limit,
    setCategory,
    setPage,
    setLimit,
    markMessageAsRead,
    deleteMessage,
  } = useAdminMessages()

  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)

  const unreadCount = useMemo(() => messages.filter((message) => message.status === "unread").length, [messages])
  const suggestionCount = useMemo(() => messages.filter((message) => message.category === "suggestion").length, [messages])
  const complaintCount = useMemo(() => messages.filter((message) => message.category === "complaint").length, [messages])
  const questionCount = useMemo(() => messages.filter((message) => message.category === "question").length, [messages])

  const handleToggleMessage = async (message: Message) => {
    const nextExpanded = expandedMessageId === message.id ? null : message.id
    setExpandedMessageId(nextExpanded)

    if (nextExpanded && message.status === "unread") {
      try {
        await markMessageAsRead(message.id)
      } catch (error) {
        console.error("Error marking message as read:", error)
      }
    }
  }

  const handleDeleteMessage = async () => {
    if (!deletingMessageId) return

    try {
      await deleteMessage(deletingMessageId)
      showToast("Mensagem excluída do app.", "success")
      if (expandedMessageId === deletingMessageId) {
        setExpandedMessageId(null)
      }
    } catch (error) {
      console.error("Error deleting message:", error)
      showToast("Não foi possível excluir a mensagem.", "error")
    } finally {
      setDeletingMessageId(null)
    }
  }

  return (
    <div className="admin-messages-page">
      <header className="admin-messages-header">
        <h2>Caixa de Mensagens</h2>
        <p>{unreadCount > 0 ? `${unreadCount} mensagem(ns) não lida(s)` : "Todas as mensagens foram lidas"}</p>
      </header>

      <section className="admin-messages-stats">
        <article>
          <strong>{total}</strong>
          <span>Total</span>
        </article>
        <article>
          <strong>{unreadCount}</strong>
          <span>Não lidas</span>
        </article>
        <article>
          <strong>{suggestionCount}</strong>
          <span>Sugestões</span>
        </article>
        <article>
          <strong>{complaintCount + questionCount}</strong>
          <span>Reclamações e Dúvidas</span>
        </article>
      </section>

      <nav className="admin-messages-tabs" aria-label="Filtro de categoria">
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={category === option.value ? "active" : ""}
            onClick={() => setCategory(option.value)}
          >
            {option.label}
          </button>
        ))}
      </nav>

      <section className="admin-messages-list">
        {isLoading ? (
          <div className="admin-messages-skeleton-list" aria-label="Carregando mensagens">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={`admin-message-skeleton-${index}`} className="admin-message-card">
                <Skeleton width="48%" height={18} />
                <div className="admin-messages-skeleton-meta">
                  <Skeleton width="26%" height={13} borderRadius={999} />
                  <Skeleton width="20%" height={13} borderRadius={999} />
                  <Skeleton width="18%" height={13} borderRadius={999} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {!isLoading && messages.length === 0 ? <p className="admin-messages-empty">Nenhuma mensagem encontrada.</p> : null}

        {messages.map((message) => {
          const isExpanded = expandedMessageId === message.id

          return (
            <article key={message.id} className={`admin-message-card ${isExpanded ? "expanded" : ""}`.trim()}>
              <button type="button" className="admin-message-summary" onClick={() => handleToggleMessage(message)}>
                <div className="admin-message-topline">
                  <h3>{message.subject}</h3>
                  <span>{new Date(message.createdAt).toLocaleString("pt-BR")}</span>
                </div>

                <div className="admin-message-meta">
                  <span>{message.senderName}</span>
                  <span>
                    Apt {message.senderApartment || "--"} Bl. {message.senderBlock ?? "--"}
                  </span>
                  <span className={`category-chip ${message.category}`.trim()}>
                    {categoryIcon(message.category)}
                    {categoryLabel(message.category)}
                  </span>
                  <span className={`status-chip ${message.status}`.trim()}>
                    {message.status === "replied" ? "Respondida" : message.status === "read" ? "Lida" : "Não lida"}
                  </span>
                  <button
                    type="button"
                    className="admin-message-delete-trigger"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeletingMessageId(message.id)
                    }}
                    aria-label={`Excluir mensagem ${message.subject}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </button>

              {isExpanded ? (
                <div className="admin-message-body">
                  <p className="admin-message-content">{message.content}</p>
                  {(message.attachments || []).length > 0 ? (
                    <div className="admin-message-attachments">
                      <h4>Anexos</h4>
                      <div className="admin-message-attachments-grid">
                        {(message.attachments || []).map((attachment, index) => (
                          <a
                            key={`${message.id}-attachment-${index}`}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-message-attachment-item"
                            aria-label={`Abrir anexo ${index + 1} da mensagem ${message.subject}`}
                          >
                            <img src={attachment} alt={`Anexo ${index + 1}`} loading="lazy" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="admin-message-replies">
                    <h4>Historico da conversa</h4>
                    {(message.replies || []).length === 0 ? <p>Nenhuma resposta enviada ainda.</p> : null}
                    {(message.replies || []).map((reply) => (
                      <div key={reply.id} className="admin-message-reply-item">
                        <div className="admin-message-reply-header">
                          <strong>{replyOriginLabel(reply)}</strong>
                          <span>{new Date(reply.createdAt).toLocaleString("pt-BR")}</span>
                          <small>{replyEmailLabel(reply)}</small>
                        </div>
                        <p>{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button type="button" className="admin-message-expand-button" onClick={() => handleToggleMessage(message)}>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </article>
          )
        })}
      </section>

      {messages.length > 0 ? (
        <PaginationControls
          compact
          currentPage={page}
          lastPage={lastPage}
          currentLimit={limit}
          onChangePage={setPage}
          onChangeLimit={setLimit}
          pageSizeOptions={[10, 20, 50]}
          className="pagination-separated"
        />
      ) : null}

      <Modal isOpen={Boolean(deletingMessageId)} onClose={() => setDeletingMessageId(null)}>
        <h2>Excluir mensagem</h2>
        <p>Tem certeza que deseja excluir esta mensagem do app?</p>
        <p>Excluir no app não remove e-mails já enviados.</p>
        <div className="admin-message-modal-actions">
          <Button variant="danger" onClick={handleDeleteMessage}>
            Excluir
          </Button>
          <Button variant="secondary" onClick={() => setDeletingMessageId(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
