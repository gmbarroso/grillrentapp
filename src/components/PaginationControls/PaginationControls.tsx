import { Button } from ".."
import "./PaginationControls.css"

interface PaginationControlsProps {
  currentPage: number
  lastPage: number
  currentLimit: number
  onChangePage: (page: number) => void
  onChangeLimit: (limit: number) => void
  pageSizeOptions?: number[]
  compact?: boolean
  className?: string
}

export default function PaginationControls({
  currentPage,
  lastPage,
  currentLimit,
  onChangePage,
  onChangeLimit,
  pageSizeOptions = [10, 20, 50],
  compact = false,
  className = "",
}: PaginationControlsProps) {
  const rootClass = `pagination-controls ${compact ? "compact" : ""} ${className}`.trim()
  const normalizedCurrentPage = Number(currentPage)
  const safeCurrentPage = Number.isFinite(normalizedCurrentPage) && normalizedCurrentPage > 0
    ? Math.floor(normalizedCurrentPage)
    : 1
  const normalizedLastPage = Number(lastPage)
  const safeLastPage = Number.isFinite(normalizedLastPage) && normalizedLastPage > 0
    ? Math.floor(normalizedLastPage)
    : 1

  return (
    <div className={rootClass}>
      <Button variant="secondary" onClick={() => onChangePage(safeCurrentPage - 1)} disabled={safeCurrentPage <= 1}>
        Anterior
      </Button>

      <span className="pagination-page-info">
        Página {safeCurrentPage} de {Math.max(1, safeLastPage)}
      </span>

      <Button
        variant="secondary"
        onClick={() => onChangePage(safeCurrentPage + 1)}
        disabled={safeCurrentPage >= Math.max(1, safeLastPage)}
      >
        Próxima
      </Button>

      <label className="pagination-limit">
        <span>Por página</span>
        <select value={currentLimit} onChange={(event) => onChangeLimit(Number(event.target.value))}>
          {pageSizeOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
