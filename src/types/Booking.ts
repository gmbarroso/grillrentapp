export interface Booking {
  id: string
  userId: string
  resourceType: "grill" | "tennis"
  resourceId: string
  startTime: string
  endTime: string
  userApartment: string
  bookedForApartment?: string
  needTablesAndChairs?: boolean
}


export interface BookingListInterface {
  id: string
  resourceId: string
  resourceType: "grill" | "tennis"
  startTime: string
  endTime: string
  userId: string
  userApartment: string
}

export interface BookingSectionProps {
  token: string
  unavailableDates: Date[]
  userId: string
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

