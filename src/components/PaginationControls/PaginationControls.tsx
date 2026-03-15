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

  return (
    <div className={rootClass}>
      <Button variant="secondary" onClick={() => onChangePage(currentPage - 1)} disabled={currentPage <= 1}>
        Anterior
      </Button>

      <span className="pagination-page-info">
        Pagina {currentPage} de {Math.max(1, lastPage)}
      </span>

      <Button
        variant="secondary"
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage >= Math.max(1, lastPage)}
      >
        Proxima
      </Button>

      <label className="pagination-limit">
        <span>Por pagina</span>
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
