import { CalendarDays, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { AdminCardsPageSkeleton, Button, Modal } from "../../components"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useCreateResource } from "../../hooks/resource/useCreateResource"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import type { Resource } from "../../types"
import "./AdminResources.css"

const DESCRIPTION_MAX_LENGTH = 160

const AdminResources = () => {
  const { token } = useAuth()
  const { showToast } = useToast()
  const { data: resources, isLoading, fetchResources } = useAllResources(token ?? "")
  const { createResource, isLoading: isCreatingResource } = useCreateResource(token ?? "")

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"hourly" | "daily">("hourly")
  const [description, setDescription] = useState("")

  const remainingDescriptionChars = useMemo(
    () => DESCRIPTION_MAX_LENGTH - description.length,
    [description.length],
  )

  const resetForm = () => {
    setName("")
    setType("hourly")
    setDescription("")
  }

  const closeModal = () => {
    setIsCreateModalOpen(false)
    resetForm()
  }

  const handleCreateResource = async () => {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName) {
      showToast("Informe o nome do recurso.", "error")
      return
    }

    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      showToast(`A descricao deve ter no maximo ${DESCRIPTION_MAX_LENGTH} caracteres.`, "error")
      return
    }

    try {
      await createResource({
        name: trimmedName,
        type,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      })
      await fetchResources()
      showToast("Recurso criado com sucesso.", "success")
      closeModal()
    } catch (error) {
      console.error("Error creating resource:", error)
      showToast("Não foi possível criar o recurso.", "error")
    }
  }

  if (isLoading) return <AdminCardsPageSkeleton />

  return (
    <div className="admin-resources-page">
      <header className="admin-page-heading with-action">
        <div>
          <h2>Resources</h2>
          <p>Gerencie os recursos disponiveis para reserva pelos moradores</p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={14} />
          Novo Recurso
        </Button>
      </header>

      <section className="resources-grid">
        {(resources ?? []).map((resource: Resource) => {
          const isHourly = resource.type === "hourly"
          return (
            <article key={resource.id} className="resource-card">
              <header>
                <div className="resource-title-block">
                  <span className="resource-icon-box">
                    <CalendarDays size={14} />
                  </span>
                  <div>
                    <h3>{resource.name}</h3>
                  </div>
                </div>
                <small>{isHourly ? "Por hora" : "Dia inteiro"}</small>
              </header>

              <p className="resource-description">
                {resource.description?.trim() || (isHourly ? "Recurso com reserva por faixa de horario" : "Recurso com reserva por dia completo")}
              </p>
            </article>
          )
        })}
      </section>

      <Modal isOpen={isCreateModalOpen} onClose={closeModal} wide>
        <div className="resource-modal">
          <h3>Novo Recurso</h3>

          <div className="resource-modal-grid">
            <label>
              Nome
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Salao de Festas"
                maxLength={80}
              />
            </label>

            <label>
              Tipo de Reserva
              <select value={type} onChange={(event) => setType(event.target.value as "hourly" | "daily")}>
                <option value="hourly">Por hora</option>
                <option value="daily">Dia inteiro</option>
              </select>
            </label>
          </div>

          <label>
            Descricao
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o recurso, capacidade, regras etc."
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
            />
          </label>

          <small className="description-counter">{remainingDescriptionChars} caracteres restantes</small>

          <div className="resource-modal-actions">
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateResource} disabled={isCreatingResource}>
              Criar Recurso
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminResources
