import Skeleton from "../Skeleton/Skeleton"
import "./DashboardHomeSkeleton.css"

export default function DashboardHomeSkeleton() {
  return (
    <div className="dashboard-home-skeleton">
      <Skeleton width="42%" height={36} />
      <Skeleton width="24%" height={20} />
      <div className="dashboard-home-skeleton-actions">
        <Skeleton height={82} />
        <Skeleton height={82} />
      </div>
      <section className="dashboard-home-skeleton-card">
        <Skeleton width="28%" height={24} />
        <div className="dashboard-home-skeleton-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={162} />
          ))}
        </div>
      </section>
      <section className="dashboard-home-skeleton-card">
        <Skeleton width="24%" height={24} />
        <div className="dashboard-home-skeleton-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} height={110} />
          ))}
        </div>
      </section>
    </div>
  )
}
