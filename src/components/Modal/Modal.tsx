"use client"

import type React from "react"
import { useEffect } from "react"
import "./Modal.css"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, wide = false }) => {
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal-content ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <span aria-hidden="true">&times;</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export default Modal
