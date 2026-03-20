import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Mail, MessageCircleWarning, SendHorizontal, Lightbulb, CircleHelp, Trash2 } from "lucide-react"
import { Button, Modal, PaginationControls, Skeleton } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useAdminMessages } from "../../hooks/message/useMessages"
import type { ContactMessageCategory, Message, MessageReply } from "../../types/Message"
import "./AdminMessages.css"

const categoryOptions: Array<{ value: ContactMessageCategory | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "suggestion", label: "Sugestoes" },
  { value: "complaint", label: "Reclamacoes" },
  { value: "question", label: "Duvidas" },
]

function categoryLabel(category: ContactMessageCategory): string {
  if (category === "complaint") return "Reclamacao"
  if (category === "question") return "Duvida"
  return "Sugestao"
}

function categoryIcon(category: ContactMessageCategory) {
  if (category === "complaint") return <MessageCircleWarning size={13} />
  if (category === "question") return <CircleHelp size={13} />
  return <Lightbulb size={13} />
}

function replyEmailLabel(reply: MessageReply): string {
  if (!reply.sendViaEmail) return "Nao enviado por e-mail"
  if (reply.emailDeliveryStatus === "sent") return "E-mail enviado"
  if (reply.emailDeliveryStatus === "failed") return "Falha no e-mail"
  if (reply.emailDeliveryStatus === "pending") return "E-mail pendente"
  if (reply.emailDeliveryStatus === "skipped") return "E-mail ignorado"
  return "E-mail nao solicitado"
}

function replyOriginLabel(reply: MessageReply): string {
  if (reply.originRole === "admin") return "Administracao (app)"
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
    replyToMessage,
    deleteMessage,
  } = useAdminMessages()

  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [draftReplyByMessageId, setDraftReplyByMessageId] = useState<Record<string, string>>({})
  const [sendViaEmailByMessageId, setSendViaEmailByMessageId] = useState<Record<string, boolean>>({})
  const [submittingMessageId, setSubmittingMessageId] = useState<string | null>(null)
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

  const handleSubmitReply = async (message: Message) => {
    const draft = (draftReplyByMessageId[message.id] || "").trim()
    if (!draft) {
      showToast("Digite uma resposta antes de enviar.", "error")
      return
    }

    setSubmittingMessageId(message.id)
    try {
      await replyToMessage(message.id, {
        content: draft,
        sendViaEmail: sendViaEmailByMessageId[message.id] ?? true,
      })
      showToast("Resposta enviada com sucesso.", "success")
      setDraftReplyByMessageId((previous) => ({ ...previous, [message.id]: "" }))
      setSendViaEmailByMessageId((previous) => ({ ...previous, [message.id]: true }))
    } catch (error) {
      console.error("Error replying to message:", error)
      showToast("Nao foi possivel enviar a resposta.", "error")
    } finally {
      setSubmittingMessageId(null)
    }
  }

  const handleDeleteMessage = async () => {
    if (!deletingMessageId) return

    try {
      await deleteMessage(deletingMessageId)
      showToast("Mensagem excluida do app.", "success")
      if (expandedMessageId === deletingMessageId) {
        setExpandedMessageId(null)
      }
    } catch (error) {
      console.error("Error deleting message:", error)
      showToast("Nao foi possivel excluir a mensagem.", "error")
    } finally {
      setDeletingMessageId(null)
    }
  }

  return (
    <div className="admin-messages-page">
      <header className="admin-messages-header">
        <h2>Caixa de Mensagens</h2>
        <p>{unreadCount > 0 ? `${unreadCount} mensagem(ns) nao lida(s)` : "Todas as mensagens foram lidas"}</p>
      </header>

      <section className="admin-messages-stats">
        <article>
          <strong>{total}</strong>
          <span>Total</span>
        </article>
        <article>
          <strong>{unreadCount}</strong>
          <span>Nao lidas</span>
        </article>
        <article>
          <strong>{suggestionCount}</strong>
          <span>Sugestoes</span>
        </article>
        <article>
          <strong>{complaintCount + questionCount}</strong>
          <span>Reclamacoes e Duvidas</span>
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
          const draft = draftReplyByMessageId[message.id] || ""
          const sendViaEmail = sendViaEmailByMessageId[message.id] ?? true

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
                    {message.status === "replied" ? "Respondida" : message.status === "read" ? "Lida" : "Nao lida"}
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

                  <div className="admin-message-replies">
                    <h4>Respostas</h4>
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

                  <div className="admin-message-reply-form">
                    <label htmlFor={`reply-${message.id}`}>Sua resposta:</label>
                    <textarea
                      id={`reply-${message.id}`}
                      rows={4}
                      placeholder="Digite sua mensagem aqui..."
                      value={draft}
                      onChange={(event) =>
                        setDraftReplyByMessageId((previous) => ({ ...previous, [message.id]: event.target.value }))
                      }
                    />

                    <label className="admin-message-email-toggle">
                      <input
                        type="checkbox"
                        checked={sendViaEmail}
                        onChange={(event) =>
                          setSendViaEmailByMessageId((previous) => ({ ...previous, [message.id]: event.target.checked }))
                        }
                      />
                      <Mail size={14} /> Enviar via e-mail para {message.senderName}
                    </label>

                    <Button
                      variant="primary"
                      onClick={() => handleSubmitReply(message)}
                      isLoading={submittingMessageId === message.id}
                      loadingText="Enviando resposta..."
                    >
                      <SendHorizontal size={14} />
                      Enviar Resposta
                    </Button>
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
        <p>Excluir no app nao remove e-mails ja enviados.</p>
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
