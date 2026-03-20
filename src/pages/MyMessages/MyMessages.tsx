import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Mail, SendHorizontal } from "lucide-react"
import { Button, PaginationControls } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useResidentMessages } from "../../hooks/message/useMessages"
import type { ContactMessageCategory, Message, MessageReply } from "../../types/Message"
import "./MyMessages.css"

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

function originLabel(reply: MessageReply): string {
  if (reply.originRole === "admin") return "Administracao (app)"
  if (reply.originChannel === "email_inbound") return "Morador (email)"
  return "Morador (app)"
}

function replyEmailLabel(reply: MessageReply): string {
  if (!reply.sendViaEmail) return "Sem notificacao por e-mail"
  if (reply.emailDeliveryStatus === "sent") return "Notificacao por e-mail enviada"
  if (reply.emailDeliveryStatus === "failed") return "Falha na notificacao por e-mail"
  if (reply.emailDeliveryStatus === "pending") return "Notificacao por e-mail pendente"
  if (reply.emailDeliveryStatus === "skipped") return "Notificacao por e-mail ignorada"
  return "Sem notificacao por e-mail"
}

export default function MyMessages() {
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
    replyToMessage,
  } = useResidentMessages()
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [draftReplyByMessageId, setDraftReplyByMessageId] = useState<Record<string, string>>({})
  const [submittingMessageId, setSubmittingMessageId] = useState<string | null>(null)

  const unreadCount = useMemo(() => messages.filter((message) => message.status === "unread").length, [messages])

  const handleToggleMessage = (message: Message) => {
    setExpandedMessageId((current) => (current === message.id ? null : message.id))
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
      })
      showToast("Resposta enviada com sucesso.", "success")
      setDraftReplyByMessageId((previous) => ({ ...previous, [message.id]: "" }))
    } catch (error) {
      console.error("Error replying to own message:", error)
      showToast("Nao foi possivel enviar a resposta.", "error")
    } finally {
      setSubmittingMessageId(null)
    }
  }

  return (
    <div className="my-messages-page">
      <header className="my-messages-header">
        <h2>Minhas Conversas</h2>
        <p>{unreadCount > 0 ? `${unreadCount} atualizacao(oes) nao lida(s)` : "Nenhuma atualizacao pendente"}</p>
      </header>

      <section className="my-messages-stats">
        <article>
          <strong>{total}</strong>
          <span>Total</span>
        </article>
        <article>
          <strong>{unreadCount}</strong>
          <span>Atualizacoes</span>
        </article>
      </section>

      <nav className="my-messages-tabs" aria-label="Filtro de categoria">
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

      <section className="my-messages-list">
        {isLoading ? <p className="my-messages-empty">Carregando conversas...</p> : null}
        {!isLoading && messages.length === 0 ? <p className="my-messages-empty">Nenhuma conversa encontrada.</p> : null}

        {messages.map((message) => {
          const isExpanded = expandedMessageId === message.id
          const draft = draftReplyByMessageId[message.id] || ""
          return (
            <article key={message.id} className={`my-message-card ${isExpanded ? "expanded" : ""}`.trim()}>
              <button type="button" className="my-message-summary" onClick={() => handleToggleMessage(message)}>
                <div className="my-message-topline">
                  <h3>{message.subject}</h3>
                  <span>{new Date(message.createdAt).toLocaleString("pt-BR")}</span>
                </div>

                <div className="my-message-meta">
                  <span>{categoryLabel(message.category)}</span>
                  <span className={`status-chip ${message.status}`.trim()}>
                    {message.status === "replied" ? "Respondida" : message.status === "read" ? "Lida" : "Com nova atividade"}
                  </span>
                </div>
              </button>

              {isExpanded ? (
                <div className="my-message-body">
                  <p className="my-message-content">{message.content}</p>

                  <div className="my-message-replies">
                    <h4>Historico da conversa</h4>
                    {(message.replies || []).length === 0 ? <p>Nenhuma resposta ainda.</p> : null}
                    {(message.replies || []).map((reply) => (
                      <div key={reply.id} className="my-message-reply-item">
                        <div className="my-message-reply-header">
                          <strong>{originLabel(reply)}</strong>
                          <span>{new Date(reply.createdAt).toLocaleString("pt-BR")}</span>
                          <small>{replyEmailLabel(reply)}</small>
                        </div>
                        <p>{reply.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="my-message-reply-form">
                    <label htmlFor={`reply-${message.id}`}>Responder:</label>
                    <textarea
                      id={`reply-${message.id}`}
                      rows={4}
                      placeholder="Escreva sua resposta..."
                      value={draft}
                      onChange={(event) =>
                        setDraftReplyByMessageId((previous) => ({ ...previous, [message.id]: event.target.value }))
                      }
                    />

                    <p className="reply-mail-note">
                      <Mail size={13} /> Se o email estiver ativo, a administracao tambem recebe notificacao.
                    </p>

                    <Button variant="primary" onClick={() => handleSubmitReply(message)} disabled={submittingMessageId === message.id}>
                      <SendHorizontal size={14} />
                      {submittingMessageId === message.id ? "Enviando..." : "Enviar Resposta"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <button type="button" className="my-message-expand-button" onClick={() => handleToggleMessage(message)}>
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
    </div>
  )
}
