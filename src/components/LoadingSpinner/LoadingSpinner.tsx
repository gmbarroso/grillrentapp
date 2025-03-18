import type React from "react"
import "./LoadingSpinner.css"

interface LoadingSpinnerProps {
  inline?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ inline = false }) => {
  if (inline) {
    return <div className="loading-spinner inline-spinner"></div>
  }

  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner"></div>
    </div>
  )
}

export default LoadingSpinner

