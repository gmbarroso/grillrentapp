import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { Toast } from "../components"

type ToastType = "success" | "error"

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type })
  }, [])

  const handleCloseToast = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleCloseToast} />}
    </ToastContext.Provider>
  )
}

