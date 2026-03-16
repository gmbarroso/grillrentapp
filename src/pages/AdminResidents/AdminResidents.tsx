import { useEffect, useMemo, useState } from "react"
import { Pencil, Search, Trash2, UserRoundPlus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../context/ToastContext"
import { Button, LoadingSpinner, Modal, PaginationControls } from "../../components"
import { useAllUsers } from "../../hooks/user/useAllUsers"
import { useUpdateUser } from "../../hooks/user/useUpdateUser"
import { useDeleteUser } from "../../hooks/user/useDeleteUser"
import type { User } from "../../types/User"
import "./AdminResidents.css"

interface ResidentRow {
  id: string
  initials: string
  name: string
  email: string
  apartmentLabel: string
  apartment: string
  block: number
  role: "Admin" | "Resident"
}

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "MR"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const AdminResidents = () => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const { users, isLoading, refreshUsers } = useAllUsers()
  const { updateUser, isLoading: isUpdatingUser } = useUpdateUser()
  const { deleteUser, isLoading: isDeletingUser } = useDeleteUser()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [editingResident, setEditingResident] = useState<ResidentRow | null>(null)
  const [deletingResident, setDeletingResident] = useState<ResidentRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editApartment, setEditApartment] = useState("")
  const [editBlock, setEditBlock] = useState<number>(1)

  const rows = useMemo<ResidentRow[]>(() => {
    return [...users]
      .map((user) => ({
        id: user.id,
        initials: getInitials(user.name),
        name: user.name,
        email: user.email,
        apartmentLabel: `Apt ${user.apartment} Bl. ${user.block}`,
        apartment: user.apartment,
        block: user.block,
        role: user.role === "admin" ? "Admin" : "Resident",
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [users])

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (!normalizedQuery) return true
      return (
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.email.toLowerCase().includes(normalizedQuery) ||
        row.apartmentLabel.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, rows])

  const lastPage = Math.max(1, Math.ceil(filteredRows.length / limit))

  const paginatedRows = useMemo(() => {
    const offset = (page - 1) * limit
    return filteredRows.slice(offset, offset + limit)
  }, [filteredRows, limit, page])

  useEffect(() => {
    setPage(1)
  }, [query])

  useEffect(() => {
    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [lastPage, page])

  const openEditModal = (resident: ResidentRow) => {
    setEditingResident(resident)
    setEditName(resident.name)
    setEditEmail(resident.email)
    setEditApartment(resident.apartment)
    setEditBlock(resident.block)
  }

  const closeEditModal = () => {
    setEditingResident(null)
    setEditName("")
    setEditEmail("")
    setEditApartment("")
    setEditBlock(1)
  }

  const handleUpdateResident = async () => {
    if (!editingResident) return

    const payload: Partial<User> = {
      name: editName.trim(),
      email: editEmail.trim(),
      apartment: editApartment.trim(),
      block: Number(editBlock),
    }

    if (!payload.name || !payload.email || !payload.apartment) {
      showToast("Please fill in name, email, and apartment.", "error")
      return
    }

    if (![1, 2].includes(payload.block || 0)) {
      showToast("Block must be 1 or 2.", "error")
      return
    }

    try {
      await updateUser(editingResident.id, payload)
      await refreshUsers()
      showToast("Resident updated successfully.", "success")
      closeEditModal()
    } catch (error) {
      console.error("Error updating resident:", error)
      showToast("Could not update resident.", "error")
    }
  }

  const handleDeleteResident = async () => {
    if (!deletingResident) return
    if (currentUser?.id === deletingResident.id) {
      showToast("You cannot remove your own account from this page.", "error")
      setDeletingResident(null)
      return
    }

    try {
      await deleteUser(deletingResident.id)
      await refreshUsers()
      showToast("Resident removed successfully.", "success")
      setDeletingResident(null)
    } catch (error) {
      console.error("Error deleting resident:", error)
      showToast("Could not remove resident.", "error")
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="admin-residents-page">
      <header className="admin-page-heading with-action">
        <div>
          <h2>Residents</h2>
          <p>{rows.length} residents registered</p>
        </div>

        <Button variant="primary" onClick={() => showToast("Resident registration will be implemented next.", "success")}>
          <UserRoundPlus size={14} />
          New Resident
        </Button>
      </header>

      <section className="admin-filter-card">
        <label className="admin-search-input">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by name, email, or apartment..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="admin-table-card">
        <header>
          <h3>{filteredRows.length} residents found</h3>
        </header>

        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Resident</th>
                <th>Email</th>
                <th>Apartment</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="resident-name-cell">
                      <span className="resident-avatar">{row.initials}</span>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.apartmentLabel}</td>
                  <td>
                    <span className={`role-pill ${row.role === "Admin" ? "admin" : "resident"}`}>{row.role}</span>
                  </td>
                  <td>
                    <div className="resident-actions">
                      <button type="button" className="table-icon-button" aria-label="Edit resident" onClick={() => openEditModal(row)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="table-icon-button danger" aria-label="Delete resident" onClick={() => setDeletingResident(row)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>No residents found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={page}
          lastPage={lastPage}
          currentLimit={limit}
          onChangePage={setPage}
          onChangeLimit={setLimit}
          className="admin-residents-pagination"
        />
      </section>

      <Modal isOpen={Boolean(editingResident)} onClose={closeEditModal}>
        <div className="resident-modal">
          <h3>Edit resident</h3>

          <label>
            Name
            <input type="text" value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={50} />
          </label>

          <label>
            Email
            <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} maxLength={100} />
          </label>

          <div className="resident-modal-grid">
            <label>
              Apartment
              <input type="text" value={editApartment} onChange={(event) => setEditApartment(event.target.value)} maxLength={20} />
            </label>

            <label>
              Block
              <select value={editBlock} onChange={(event) => setEditBlock(Number(event.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
          </div>

          <div className="resident-modal-actions">
            <Button variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateResident} disabled={isUpdatingUser}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(deletingResident)} onClose={() => setDeletingResident(null)}>
        <div className="resident-modal resident-delete-modal">
          <h3>Remove resident</h3>
          <p>
            Are you sure you want to remove{" "}
            <strong>{deletingResident?.name}</strong>?
          </p>

          <div className="resident-modal-actions">
            <Button variant="secondary" onClick={() => setDeletingResident(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteResident} disabled={isDeletingUser}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminResidents
