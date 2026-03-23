import type { CSSProperties } from "react"
import "./Skeleton.css"

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  className?: string
}

const resolveSize = (value?: number | string): string | undefined => {
  if (value === undefined) return undefined
  return typeof value === "number" ? `${value}px` : value
}

export default function Skeleton({ width, height, borderRadius, className = "" }: SkeletonProps) {
  const style: CSSProperties = {
    width: resolveSize(width),
    height: resolveSize(height),
    borderRadius: resolveSize(borderRadius),
  }

  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}
