export interface Booking {
  id: string
  userId: string
  resourceType: "grill" | "tennis"
  resourceId: string
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
  resourceType: "grill" | "tennis"
  startTime: string
  endTime: string
  userId: string
  userApartment: string
  bookedOnBehalf?: string
  needTablesAndChairs?: boolean
}

export interface BookingSectionProps {
  token: string
  unavailableDates: Date[]
  userId: string
  onBookingCreated: () => void
  onBookingError: (errorMessage: string) => void
}

export interface BookingListProps {
  bookings: Booking[]
  total: number
  currentPage: number
  lastPage: number
  currentLimit: number
  currentSort: string
  currentOrder: "ASC" | "DESC"
  onBookingDeleted: (bookingId: string) => void
  onChangePage: (page: number) => void
  onChangeLimit: (limit: number) => void
  onChangeSort: (sort: string) => void
  onChangeOrder: (order: "ASC" | "DESC") => void
}

