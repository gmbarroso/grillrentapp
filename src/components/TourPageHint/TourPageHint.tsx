import { useLocation, useNavigate } from "react-router-dom"
import Button from "../Button/Button"
import "./TourPageHint.css"

interface TourPageHintProps {
  title: string
  description: string
  stepIndex: number
  totalSteps: number
  backTo?: string
  nextTo: string
  nextLabel?: string
}

export default function TourPageHint({
  title,
  description,
  stepIndex,
  totalSteps,
  backTo,
  nextTo,
  nextLabel = "Proximo",
}: TourPageHintProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const isTourPreview = searchParams.get("startTour") === "1"
  const activeStepRaw = Number(searchParams.get("tourStep") ?? "-1")
  const isOnStep = Number.isInteger(activeStepRaw) && activeStepRaw === stepIndex

  if (!isTourPreview || !isOnStep) return null

  return (
    <section className="tour-page-hint" aria-live="polite">
      <div>
        <span className="tour-page-hint-chip">Tour {stepIndex + 1}/{totalSteps}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="tour-page-hint-actions">
        {backTo ? (
          <Button type="button" variant="secondary" onClick={() => navigate(backTo)}>
            Voltar
          </Button>
        ) : null}
        <Button type="button" onClick={() => navigate(nextTo)}>
          {nextLabel}
        </Button>
      </div>
    </section>
  )
}
