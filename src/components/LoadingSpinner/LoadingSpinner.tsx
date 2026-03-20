import type React from "react"
import Skeleton from "../Skeleton/Skeleton"
import "./LoadingSpinner.css"

interface LoadingSpinnerProps {
  inline?: boolean
  overlay?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ inline = false, overlay = false }) => {
  if (inline) {
    return (
      <div className="loading-skeleton-inline" role="status" aria-live="polite" aria-label="Carregando">
        <Skeleton width={110} height={14} borderRadius={999} />
      </div>
    )
  }

  return (
    <div className={`loading-skeleton-container ${overlay ? "loading-skeleton-overlay" : ""}`.trim()} role="status" aria-live="polite">
      <div className="loading-skeleton-card" aria-label="Carregando conteúdo">
        <Skeleton width="40%" height={28} />
        <Skeleton width="65%" height={16} />
        <Skeleton width="100%" height={72} />
        <Skeleton width="100%" height={72} />
      </div>
    </div>
  )
}

export default LoadingSpinner
