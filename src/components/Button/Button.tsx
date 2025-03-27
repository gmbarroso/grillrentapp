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
  showToastOnClick,
  fullWidth = false,
  onClick,
  ...props
}) => {
  const { showToast } = useToast()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
    <button className={buttonClasses} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export default Button

