"use client"

import type React from "react"
import { useEffect, useState } from "react"
import "./Drawer.css"

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  closeButton?: boolean
  side?: "right" | "left"
}

const TRANSITION_MS = 240

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, closeButton = true, side = "right" }) => {
  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      let rafId1: number | null = null
      let rafId2: number | null = null

      // Force initial off-screen state, then animate in on the next paint.
      setShouldRender(true)
      setIsVisible(false)

      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })

      return () => {
        if (rafId1 !== null) window.cancelAnimationFrame(rafId1)
        if (rafId2 !== null) window.cancelAnimationFrame(rafId2)
      }
    }

    setIsVisible(false)
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
    }, TRANSITION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <div
      className={`drawer-overlay ${isVisible ? "open" : "closing"}`.trim()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`drawer-panel side-${side} ${isVisible ? "open" : "closing"}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {closeButton ? (
          <button className="drawer-close" onClick={onClose} aria-label="Fechar">
            <span aria-hidden="true">&times;</span>
          </button>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export default Drawer
