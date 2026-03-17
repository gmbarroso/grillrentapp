import { useMemo, useState } from "react"
import { Filter, Search, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { Button, LoadingSpinner, Modal, PaginationControls, Tooltip } from "../../components"
import { useAdminBookedDates } from "../../hooks/booking/useAdminBookedDates"
import { useDeleteBooking } from "../../hooks/booking/useDeleteBooking"
import type { Booking } from "../../types/Booking"
import { formatBookingDate, formatBookingTimeInterval, parseBookingDateTime } from "../../utils/booking-datetime"
import "./AdminBookings.css"

type StatusFilter = "all" | "confirmed"
type ResourceFilter = "all" | "hourly" | "daily"

const AdminBookings = () => {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all")
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null)

  const { bookings, total, page, lastPage, limit, setPage, setLimit, isLoading, refreshBookedDates } = useAdminBookedDates({ initialLimit: 10 })
  const { deleteBooking, isLoading: isDeleting } = useDeleteBooking(token ?? "")

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...bookings]
      .sort((a, b) => parseBookingDateTime(a.startTime).getTime() - parseBookingDateTime(b.startTime).getTime())
      .filter((booking) => {
        const status = "confirmed"
        if (statusFilter !== "all" && status !== statusFilter) return false

        if (resourceFilter !== "all" && booking.resourceType !== resourceFilter) return false

        if (!query) return true

        const apt = `${booking.userApartment} bl. ${booking.userBlock}`.toLowerCase()
        const resource = booking.resourceType === "hourly" ? "por hora" : "dia inteiro"
        return apt.includes(query) || resource.includes(query)
      })
  }, [bookings, search, statusFilter, resourceFilter])

  const handleDeleteBooking = async () => {
    if (!deletingBooking) return

    const result = await deleteBooking(deletingBooking.id)
    if (result.success) {
      await refreshBookedDates()
      showToast("Reserva removida com sucesso.", "success")
    } else {
      showToast("Erro ao remover reserva.", "error")
    }

    setDeletingBooking(null)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="admin-bookings-page">
      <header className="admin-page-heading">
        <h2>Todas as Reservas</h2>
        <p>Visualize e gerencie todas as reservas do condominio</p>
      </header>

      <section className="admin-filter-card">
        <label className="admin-search-input">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por nome, apartamento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="admin-filter-row">
          <label className="admin-select-wrap">
            <Filter size={14} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">Todos Status</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </label>

          <label className="admin-select-wrap">
            <select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value as ResourceFilter)}>
              <option value="all">Todos Recursos</option>
              <option value="hourly">Por hora</option>
              <option value="daily">Dia inteiro</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-table-card">
        <header>
          <h3>{total} reservas encontradas</h3>
        </header>

        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Data</th>
                <th>Horario</th>
                <th>Morador</th>
                <th>Apt.</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-bookings-empty-row">
                    Nenhuma reserva encontrada para os filtros aplicados nesta pagina.
                  </td>
                </tr>
              ) : null}
              {filteredBookings.map((booking) => {
                return (
                  <tr key={booking.id}>
                    <td>
                      <span className={`resource-dot ${booking.resourceType}`}></span>
                      {booking.resourceType === "hourly" ? "Por hora" : "Dia inteiro"}
                    </td>
                    <td>{formatBookingDate(booking.startTime, "pt-BR")}</td>
                    <td>
                      {booking.resourceType === "daily"
                        ? "Dia inteiro"
                        : formatBookingTimeInterval(booking.startTime, booking.endTime).replace("h", "").replace(" - ", " - ")}
                    </td>
                    <td>{`Apt ${booking.userApartment} Bl. ${booking.userBlock}`}</td>
                    <td>{`${booking.userApartment} Bl. ${booking.userBlock}`}</td>
                    <td>
                      <span className="status-pill confirmed">Confirmado</span>
                      {booking.bookedOnBehalf?.trim() ? (
                        <span className="status-tooltip-wrap">
                          <Tooltip content={`Reservado para o apartamento ${booking.bookedOnBehalf}`} iconText="!" />
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <button type="button" className="table-icon-button" onClick={() => setDeletingBooking(booking)} aria-label="Excluir reserva">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {total > 0 ? (
        <PaginationControls
          compact
          currentPage={page}
          lastPage={lastPage}
          currentLimit={limit}
          onChangePage={setPage}
          onChangeLimit={setLimit}
          pageSizeOptions={[10, 20, 50]}
          className="admin-bookings-pagination"
        />
      ) : null}

      <Modal isOpen={Boolean(deletingBooking)} onClose={() => setDeletingBooking(null)}>
        <h2>Cancelar reserva</h2>
        <p>Deseja realmente cancelar esta reserva?</p>
        <div className="admin-modal-actions">
          <Button variant="danger" onClick={handleDeleteBooking} disabled={isDeleting}>
            Cancelar reserva
          </Button>
          <Button variant="secondary" onClick={() => setDeletingBooking(null)}>
            Voltar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminBookings
