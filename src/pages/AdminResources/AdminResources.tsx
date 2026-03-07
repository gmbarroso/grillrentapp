import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react"
import { Button, LoadingSpinner } from "../../components"
import { useAllResources } from "../../hooks/resource/useAllResources"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import "./AdminResources.css"

const AdminResources = () => {
  const { token } = useAuth()
  const { showToast } = useToast()
  const { data: resources, isLoading } = useAllResources(token ?? "")

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="admin-resources-page">
      <header className="admin-page-heading with-action">
        <div>
          <h2>Recursos</h2>
          <p>Gerencie os recursos disponiveis para reserva pelos moradores</p>
        </div>

        <Button variant="primary" onClick={() => showToast("Cadastro de recursos sera implementado em seguida.", "success")}>
          <Plus size={14} />
          Novo Recurso
        </Button>
      </header>

      <section className="resources-grid">
        {(resources ?? []).map((resource: { id: string; type: "grill" | "tennis"; name: string }) => {
          const isTennis = resource.type === "tennis"
          return (
            <article key={resource.id} className="resource-card">
              <header>
                <div className="resource-title-block">
                  <span className="resource-icon-box">
                    <CalendarDays size={14} />
                  </span>
                  <div>
                    <h3>{resource.name}</h3>
                    <p>{resource.type}</p>
                  </div>
                </div>
                <small>{isTennis ? "Por hora" : "Dia inteiro"}</small>
              </header>

              <p className="resource-description">
                {isTennis ? "Quadra profissional com iluminacao noturna" : "Area de churrasqueira com mesas, cadeiras e espaco coberto"}
              </p>

              <footer>
                <button type="button">
                  <Pencil size={13} />
                  Editar
                </button>
                <button type="button" className="danger">
                  <Trash2 size={13} />
                  Excluir
                </button>
              </footer>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default AdminResources
