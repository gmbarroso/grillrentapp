import { useState, type FormEvent } from "react"
import { Mail, Phone, MapPin, Clock3, Send } from "lucide-react"
import { useToast } from "../../context/ToastContext"
import { useCreateContactMessage } from "../../hooks/message/useMessages"
import { useOrganizationSettings } from "../../hooks/organization/useOrganizationSettings"
import { Button, ImageDropzone, TourPageHint } from "../../components"
import "./Contact.css"

type ContactCategory = "suggestion" | "complaint" | "question"
const MAX_ATTACHMENTS = 5
const ATTACHMENT_MAX_FILE_SIZE_MB = 1

const Contact = () => {
  const { showToast } = useToast()
  const { createContactMessage } = useCreateContactMessage()
  const { organization } = useOrganizationSettings()
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<ContactCategory>("suggestion")
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddAttachment = (imageDataUrl: string) => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      showToast(`Limite de ${MAX_ATTACHMENTS} imagens atingido.`, "error")
      return
    }

    setAttachments((previous) => [...previous, imageDataUrl])
  }

  const handleReplaceAttachment = (index: number, imageDataUrl: string) => {
    setAttachments((previous) => previous.map((attachment, currentIndex) => (currentIndex === index ? imageDataUrl : attachment)))
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!subject.trim() || !message.trim()) {
      showToast("Preencha assunto e mensagem para enviar.", "error")
      return
    }

    setIsSubmitting(true)
    try {
      await createContactMessage({
        subject: subject.trim(),
        category,
        content: message.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      showToast("Mensagem enviada com sucesso.", "success")
      setSubject("")
      setCategory("suggestion")
      setMessage("")
      setAttachments([])
    } catch (error) {
      console.error("Error sending contact message:", error)
      showToast("Não foi possível enviar a mensagem. Tente novamente.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactEmail = organization?.email || "Não informado"
  const contactPhone = organization?.phone || "Em breve"
  const contactAddress = organization?.address || "Não informado"
  const contactBusinessHours = organization?.businessHours || "Não informado"

  return (
    <div className="contact-page-v2">
      <TourPageHint
        title="Contato"
        description="Use esta página para enviar sugestões, reclamações e dúvidas. A administração recebe a mensagem no faleconosco vinculada ao seu email validado."
        stepIndex={8}
        totalSteps={10}
        backTo="/profile?startTour=1&tourStep=7"
        nextTo="/?startTour=1&tourStep=9"
        nextLabel="Próximo"
      />

      <section className="contact-card-v2">
        <header>
          <h2>Fale Conosco</h2>
          <p>Entre em contato com a administração do condomínio</p>
        </header>

        <div className="contact-info-list">
          <article className="contact-info-row">
            <span>
              <Mail size={15} />
            </span>
            <div>
              <strong>Email</strong>
              {organization?.email ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : <p>{contactEmail}</p>}
            </div>
          </article>

          <article className="contact-info-row">
            <span>
              <Phone size={15} />
            </span>
            <div>
              <strong>Telefone</strong>
              <p>{contactPhone}</p>
            </div>
          </article>

          <article className="contact-info-row">
            <span>
              <MapPin size={15} />
            </span>
            <div>
              <strong>Endereco</strong>
              <p>{contactAddress}</p>
            </div>
          </article>

          <article className="contact-info-row">
            <span>
              <Clock3 size={15} />
            </span>
            <div>
              <strong>Horário de Atendimento</strong>
              <p>{contactBusinessHours}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="contact-card-v2">
        <header>
          <h2>Enviar Mensagem</h2>
          <p>Envie sugestões, reclamações ou dúvidas diretamente para a administração.</p>
        </header>

        <form className="contact-form-v2" onSubmit={handleSubmit}>
          <label htmlFor="contact-subject">Assunto</label>
          <input
            id="contact-subject"
            type="text"
            placeholder="Descreva brevemente o assunto"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />

          <label htmlFor="contact-category">Categoria</label>
          <select
            id="contact-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ContactCategory)}
          >
            <option value="suggestion">Sugestão</option>
            <option value="complaint">Reclamação</option>
            <option value="question">Dúvida</option>
          </select>

          <label htmlFor="contact-message">Mensagem</label>
          <textarea
            id="contact-message"
            rows={6}
            placeholder="Escreva sua mensagem aqui..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />

          <label>Anexar imagens (opcional)</label>
          <p className="contact-attachment-hint">
            Você pode adicionar até {MAX_ATTACHMENTS} imagens, com no máximo {ATTACHMENT_MAX_FILE_SIZE_MB}MB cada.
          </p>
          <div className="contact-attachments-grid">
            {attachments.map((attachment, index) => (
              <ImageDropzone
                key={`contact-attachment-${index}`}
                imageUrl={attachment}
                onImageChange={(imageDataUrl) => handleReplaceAttachment(index, imageDataUrl)}
                onImageRemove={() => handleRemoveAttachment(index)}
                onError={(errorMessage) => showToast(errorMessage, "error")}
                disabled={isSubmitting}
                maxFileSizeMb={ATTACHMENT_MAX_FILE_SIZE_MB}
                emptyLabel={`Img ${index + 1}`}
              />
            ))}
            {attachments.length < MAX_ATTACHMENTS ? (
              <ImageDropzone
                key="contact-attachment-add"
                onImageChange={handleAddAttachment}
                onImageRemove={() => undefined}
                onError={(errorMessage) => showToast(errorMessage, "error")}
                disabled={isSubmitting}
                maxFileSizeMb={ATTACHMENT_MAX_FILE_SIZE_MB}
                helperText={`${attachments.length}/${MAX_ATTACHMENTS}`}
                emptyLabel="+"
              />
            ) : null}
          </div>

          <Button variant="primary" type="submit" fullWidth disabled={isSubmitting}>
            <Send size={14} />
            {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </form>
      </section>
    </div>
  )
}

export default Contact
