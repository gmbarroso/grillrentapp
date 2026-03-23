export interface Booking {
  id: string
  userId: string
  resourceType: "daily" | "hourly"
  resourceId: string
  resourceName: string
  startTime: string
  endTime: string
  userApartment: string
  userBlock: string
  needTablesAndChairs?: boolean
  bookedOnBehalf?: string
}

export interface BookingListInterface {
  id: string
  resourceId: string
  resourceType: "daily" | "hourly"
  resourceName: string
  startTime: string
  endTime: string
  userId: string
  userApartment: string
  bookedOnBehalf?: string
  needTablesAndChairs?: boolean
}

export interface BookingSectionProps {
  token: string
  onBookingCreated: () => void
}

export interface BookingListProps {
  bookings: Booking[]
  currentPage: number
  lastPage: number
  currentLimit: number
  currentSort: string
  currentOrder: "ASC" | "DESC"
  onBookingDeleted: () => void
  onChangePage: (page: number) => void
  onChangeLimit: (limit: number) => void
  onChangeSort: (sort: string) => void
  onChangeOrder: (order: "ASC" | "DESC") => void
}

export interface BatchBookingSlotInput {
  startTime: string
  endTime: string
}

export interface BatchBookingSkippedItem {
  startTime: string
  endTime: string
  reason: string
}

export interface BatchBookingSummary {
  requested: number
  created: number
  skipped: number
}

export interface BatchBookingResponse {
  message: string
  summary: BatchBookingSummary
  created: Booking[]
  skipped: BatchBookingSkippedItem[]
}
