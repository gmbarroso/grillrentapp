"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import "./Toast.css"

interface ToastProps {
  message: string
  type: "success" | "error"
  duration?: number
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return createPortal(
    <div className={`toast ${type === "success" ? "toast-success" : "toast-error"}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => setIsVisible(false)}>
        ×
      </button>
    </div>,
    document.body,
  )
}

export default Toast

