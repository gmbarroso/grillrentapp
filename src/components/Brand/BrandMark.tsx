import "./BrandMark.css"

interface BrandMarkProps {
  compact?: boolean
  showTagline?: boolean
  className?: string
}

export default function BrandMark({ compact = false, showTagline = true, className = "" }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark-compact" : ""} ${className}`.trim()}>
      <div className="brand-avatar" aria-hidden="true">
        <img src="/images/seu-ze-mascot.png" alt="" />
      </div>
      <div className="brand-wordmark" aria-label="Seu.Zé">
        <span className="brand-wordmark-seu">Seu.</span>
        <span className="brand-wordmark-ze">Zé</span>
      </div>
      {showTagline && (
        <p className="brand-tagline">
          <span className="brand-tagline-line" aria-hidden="true" />
          O zelador digital
          <span className="brand-tagline-line" aria-hidden="true" />
        </p>
      )}
    </div>
  )
}
