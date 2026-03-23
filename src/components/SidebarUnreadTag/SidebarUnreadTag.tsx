interface SidebarUnreadTagProps {
  unreadCount?: number
  showDot?: boolean
  ariaLabel?: string
}

export default function SidebarUnreadTag({ unreadCount = 0, showDot = false, ariaLabel = "Itens não lidos" }: SidebarUnreadTagProps) {
  if (unreadCount > 0) {
    return (
      <small className="dashboard-nav-unread-tag" aria-label={ariaLabel}>
        {unreadCount > 99 ? "99+" : unreadCount}
      </small>
    )
  }

  if (showDot) {
    return <small className="dashboard-nav-dot" aria-label={ariaLabel} />
  }

  return null
}
