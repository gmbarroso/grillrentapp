import { useMemo, useState } from "react"
import { Pencil, Search, Trash2, UserRoundPlus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { Button } from "../../components"
import { useAllBookings } from "../../hooks/booking/useAllBookings"
import "./AdminResidents.css"

interface ResidentRow {
  id: string
  initials: string
  name: string
  email: string
  apartment: string
  role: "Admin" | "Morador"
}

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "MR"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const AdminResidents = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { bookings } = useAllBookings({ initialLimit: 500 })
  const [query, setQuery] = useState("")

  const rows = useMemo<ResidentRow[]>(() => {
    const map = new Map<string, ResidentRow>()

    bookings.forEach((booking) => {
      const key = `${booking.userApartment}-${booking.userBlock}`
      if (map.has(key)) return

      const name = `Morador Apt ${booking.userApartment}`
      map.set(key, {
        id: booking.userId || key,
        initials: getInitials(name),
        name,
        email: "email@morador.com",
        apartment: `Apt ${booking.userApartment} Bl. ${booking.userBlock}`,
        role: "Morador",
      })
    })

    if (user) {
      const key = `${user.apartment}-${user.block}`
      map.set(key, {
        id: user.id,
        initials: getInitials(user.name),
        name: user.name,
        email: user.email,
        apartment: `Apt ${user.apartment} Bl. ${user.block}`,
        role: user.role === "admin" ? "Admin" : "Morador",
      })
    }

    const normalizedQuery = query.trim().toLowerCase()

    return [...map.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((row) => {
        if (!normalizedQuery) return true
        return row.name.toLowerCase().includes(normalizedQuery) || row.email.toLowerCase().includes(normalizedQuery) || row.apartment.toLowerCase().includes(normalizedQuery)
      })
  }, [bookings, query, user])

  return (
    <div className="admin-residents-page">
      <header className="admin-page-heading with-action">
        <div>
          <h2>Moradores</h2>
          <p>{rows.length} moradores cadastrados</p>
        </div>

        <Button variant="primary" onClick={() => showToast("Cadastro de morador sera implementado em seguida.", "success")}>
          <UserRoundPlus size={14} />
          Novo Morador
        </Button>
      </header>

      <section className="admin-filter-card">
        <label className="admin-search-input">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou apartamento..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="admin-table-card">
        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Morador</th>
                <th>Email</th>
                <th>Apartamento</th>
                <th>Funcao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="resident-name-cell">
                      <span className="resident-avatar">{row.initials}</span>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.apartment}</td>
                  <td>
                    <span className={`role-pill ${row.role === "Admin" ? "admin" : "resident"}`}>{row.role}</span>
                  </td>
                  <td>
                    <div className="resident-actions">
                      <button type="button" className="table-icon-button" aria-label="Editar morador">
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="table-icon-button danger" aria-label="Excluir morador">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminResidents
