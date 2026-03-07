import { useState, type FormEvent } from "react"
import { Mail, Phone, MapPin, Clock3, Send } from "lucide-react"
import { useToast } from "../../context/ToastContext"
import { Button } from "../../components"
import "./Contact.css"

type ContactCategory = "Sugestao" | "Reclamacao" | "Duvida"

const Contact = () => {
  const { showToast } = useToast()
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<ContactCategory>("Sugestao")
  const [message, setMessage] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!subject.trim() || !message.trim()) {
      showToast("Preencha assunto e mensagem para enviar.", "error")
      return
    }

    showToast("Mensagem enviada com sucesso.", "success")
    setSubject("")
    setCategory("Sugestao")
    setMessage("")
  }

  return (
    <div className="contact-page-v2">
      <section className="contact-card-v2">
        <header>
          <h2>Fale Conosco</h2>
          <p>Entre em contato com a administracao do condominio</p>
        </header>

        <div className="contact-info-list">
          <article className="contact-info-row">
            <span>
              <Mail size={15} />
            </span>
            <div>
              <strong>Email</strong>
              <a href="mailto:faleconosco.chacara@gmail.com">faleconosco.chacara@gmail.com</a>
            </div>
          </article>

          <article className="contact-info-row">
            <span>
              <Phone size={15} />
            </span>
            <div>
              <strong>WhatsApp</strong>
              <p>Em breve</p>
            </div>
          </article>

          <article className="contact-info-row">
            <span>
              <MapPin size={15} />
            </span>
            <div>
              <strong>Endereco</strong>
              <p>Rua Sacopa, 852, Lagoa - Rio de Janeiro - RJ - 22471-180</p>
            </div>
          </article>

          <article className="contact-info-row">
            <span>
              <Clock3 size={15} />
            </span>
            <div>
              <strong>Horario de Atendimento</strong>
              <p>Segunda a sexta, das 9h as 18h</p>
            </div>
          </article>
        </div>
      </section>

      <section className="contact-card-v2">
        <header>
          <h2>Enviar Mensagem</h2>
          <p>Envie sugestoes, reclamacoes ou duvidas diretamente para a administracao.</p>
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
            <option value="Sugestao">Sugestao</option>
            <option value="Reclamacao">Reclamacao</option>
            <option value="Duvida">Duvida</option>
          </select>

          <label htmlFor="contact-message">Mensagem</label>
          <textarea
            id="contact-message"
            rows={6}
            placeholder="Escreva sua mensagem aqui..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />

          <Button variant="primary" type="submit" fullWidth>
            <Send size={14} />
            Enviar Mensagem
          </Button>
        </form>
      </section>
    </div>
  )
}

export default Contact
