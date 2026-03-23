import type React from "react"
import Skeleton from "../Skeleton/Skeleton"
import "./PageSkeletons.css"

interface AdminTablePageSkeletonProps {
  withAction?: boolean
  statsCount?: number
  filters?: number
  columns?: number
  rows?: number
}

interface AdminCardsPageSkeletonProps {
  withAction?: boolean
  cards?: number
}

const repeat = (count: number) => Array.from({ length: count })

export const AdminTablePageSkeleton: React.FC<AdminTablePageSkeletonProps> = ({
  withAction = true,
  statsCount = 0,
  filters = 2,
  columns = 5,
  rows = 7,
}) => (
  <div className="page-skeleton page-skeleton-admin">
    <header className="page-skeleton-header">
      <div className="page-skeleton-heading">
        <Skeleton width="42%" height={30} />
        <Skeleton width="30%" height={14} />
      </div>
      {withAction ? <Skeleton width={146} height={36} borderRadius={8} /> : null}
    </header>

    {statsCount > 0 ? (
      <section className="page-skeleton-stats">
        {repeat(statsCount).map((_, index) => (
          <div key={`stats-${index}`} className="page-skeleton-card">
            <Skeleton width="45%" height={24} />
            <Skeleton width="65%" height={12} />
          </div>
        ))}
      </section>
    ) : null}

    <section className="page-skeleton-card page-skeleton-filters">
      {repeat(filters).map((_, index) => (
        <Skeleton key={`filter-${index}`} width={index === 0 ? "100%" : "42%"} height={38} borderRadius={8} />
      ))}
    </section>

    <section className="page-skeleton-card page-skeleton-table">
      <div className="page-skeleton-table-header">
        <Skeleton width="28%" height={20} />
      </div>
      <div className="page-skeleton-table-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {repeat(columns).map((_, index) => (
          <Skeleton key={`th-${index}`} width="80%" height={12} />
        ))}
      </div>
      <div className="page-skeleton-table-rows">
        {repeat(rows).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="page-skeleton-table-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {repeat(columns).map((_, columnIndex) => (
              <Skeleton key={`cell-${rowIndex}-${columnIndex}`} width="88%" height={15} />
            ))}
          </div>
        ))}
      </div>
    </section>
  </div>
)

export const AdminCardsPageSkeleton: React.FC<AdminCardsPageSkeletonProps> = ({ withAction = true, cards = 6 }) => (
  <div className="page-skeleton page-skeleton-admin">
    <header className="page-skeleton-header">
      <div className="page-skeleton-heading">
        <Skeleton width="34%" height={30} />
        <Skeleton width="44%" height={14} />
      </div>
      {withAction ? <Skeleton width={146} height={36} borderRadius={8} /> : null}
    </header>

    <section className="page-skeleton-grid">
      {repeat(cards).map((_, index) => (
        <article key={`card-${index}`} className="page-skeleton-card">
          <div className="page-skeleton-row">
            <Skeleton width={34} height={34} borderRadius={8} />
            <Skeleton width="42%" height={16} />
          </div>
          <Skeleton width="82%" height={14} />
          <Skeleton width="68%" height={14} />
        </article>
      ))}
    </section>
  </div>
)

export const ProfilePageSkeleton: React.FC = () => (
  <div className="page-skeleton page-skeleton-profile">
    <section className="page-skeleton-card">
      <div className="page-skeleton-row">
        <Skeleton width={20} height={20} borderRadius={999} />
        <Skeleton width="34%" height={24} />
      </div>

      <div className="page-skeleton-form">
        {repeat(6).map((_, index) => (
          <div key={`field-${index}`} className="page-skeleton-form-field">
            <Skeleton width="26%" height={12} />
            <Skeleton width="100%" height={40} borderRadius={8} />
          </div>
        ))}
      </div>

      <div className="page-skeleton-actions">
        <Skeleton width="100%" height={38} borderRadius={8} />
        <Skeleton width="100%" height={38} borderRadius={8} />
      </div>
    </section>
  </div>
)

export const SettingsFormPageSkeleton: React.FC = () => (
  <div className="page-skeleton page-skeleton-admin">
    <Skeleton width={120} height={16} />

    <header className="page-skeleton-heading">
      <Skeleton width="34%" height={30} />
      <Skeleton width="56%" height={14} />
    </header>

    <section className="page-skeleton-card">
      <div className="page-skeleton-row">
        <Skeleton width={34} height={34} borderRadius={8} />
        <div className="page-skeleton-stack">
          <Skeleton width={170} height={16} />
          <Skeleton width={240} height={12} />
        </div>
      </div>

      <div className="page-skeleton-form">
        {repeat(8).map((_, index) => (
          <div key={`settings-field-${index}`} className="page-skeleton-form-field">
            <Skeleton width="30%" height={12} />
            <Skeleton width="100%" height={40} borderRadius={8} />
          </div>
        ))}
      </div>

      <div className="page-skeleton-actions page-skeleton-actions-end">
        <Skeleton width={110} height={36} borderRadius={8} />
        <Skeleton width={180} height={36} borderRadius={8} />
      </div>
    </section>
  </div>
)

export const NoticePageSkeleton: React.FC<{ withAction?: boolean }> = ({ withAction = false }) => (
  <div className="page-skeleton page-skeleton-admin">
    <header className="page-skeleton-header">
      <div className="page-skeleton-heading">
        <Skeleton width="36%" height={30} />
        <Skeleton width="45%" height={14} />
      </div>
      {withAction ? <Skeleton width={130} height={36} borderRadius={8} /> : null}
    </header>

    <section className="page-skeleton-list">
      {repeat(5).map((_, index) => (
        <article key={`notice-${index}`} className="page-skeleton-card page-skeleton-list-item">
          <Skeleton width="44%" height={18} />
          <Skeleton width="22%" height={12} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="92%" height={14} />
        </article>
      ))}
    </section>
  </div>
)

export const SchedulerSlotsSkeleton: React.FC = () => (
  <div className="scheduler-loading-skeleton" aria-label="Carregando horarios">
    {repeat(6).map((_, index) => (
      <div key={`scheduler-row-${index}`} className="scheduler-loading-row">
        <Skeleton width="42%" height={16} />
        <Skeleton width={108} height={30} borderRadius={8} />
      </div>
    ))}
  </div>
)
