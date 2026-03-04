import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import "./QuickActionCard.css"

interface QuickActionCardProps {
  title: string
  subtitle: string
  to: string
  icon: LucideIcon
  tone?: "blue" | "yellow"
}

export default function QuickActionCard({ title, subtitle, to, icon: Icon, tone = "blue" }: QuickActionCardProps) {
  return (
    <Link to={to} className={`quick-action-card quick-action-card-${tone}`.trim()}>
      <div className="quick-action-icon">
        <Icon size={20} />
      </div>
      <div className="quick-action-content">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <span className="quick-action-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
