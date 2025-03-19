"\"use client"

import type React from "react"
import { useState } from "react"
import "./Tooltip.css"

interface TooltipProps {
  content: string
}

const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="tooltip-container" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      <span className="tooltip-icon">?</span>
      {isVisible && <div className="tooltip-content">{content}</div>}
    </div>
  )
}

export default Tooltip

