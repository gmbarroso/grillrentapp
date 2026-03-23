import type { ReactNode } from "react"
import "./AuthCard.css"

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <section className="auth-card">
      <header className="auth-card-header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className="auth-card-content">{children}</div>
    </section>
  )
}
