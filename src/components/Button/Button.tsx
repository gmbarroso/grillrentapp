"use client"

import type React from "react"
import type { ButtonHTMLAttributes } from "react"
import { useToast } from "../../context/ToastContext"
import "./Button.css"

export type ButtonVariant = "primary" | "secondary" | "danger" | "dark" | "link"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  className?: string
  isLoading?: boolean
  loadingText?: string
  showToastOnClick?: {
    message: string
    type: "success" | "error"
  }
  fullWidth?: boolean
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  isLoading = false,
  loadingText,
  showToastOnClick,
  fullWidth = false,
  onClick,
  disabled,
  ...props
}) => {
  const { showToast } = useToast()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) return

    if (onClick) {
      onClick(e)
    }

    if (showToastOnClick) {
      showToast(showToastOnClick.message, showToastOnClick.type)
    }
  }

  const buttonClasses = `
    button 
    button-${variant} 
    button-${size}
    ${fullWidth ? "button-full-width" : ""}
    ${className}
  `

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="button-loading-content">
          <span className="button-loading-spinner" aria-hidden="true" />
          <span>{loadingText || (typeof children === "string" ? children : "Carregando...")}</span>
        </span>
      ) : children}
    </button>
  )
}

export default Button
