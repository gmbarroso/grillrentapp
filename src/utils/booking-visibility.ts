import type { Booking } from "../types/Booking"
import type { User } from "../types/User"
import { parseBookingDateTime } from "./booking-datetime"

const DIGITS_REGEX = /\d+/g

const normalizeText = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()

const normalizeApartment = (value?: string | number | null) =>
  normalizeText(value)
    .replace(/apartamento|apartment|apto\.?|apt\.?|unidade|unit/gi, "")
    .replace(/[^a-z0-9]/g, "")

const parseBlockNumber = (value?: string | number | null) => {
  const normalized = normalizeText(value)
  const digits = normalized.match(DIGITS_REGEX)
  if (!digits || digits.length === 0) return null

  const parsed = Number.parseInt(digits[0], 10)
  return Number.isNaN(parsed) ? null : parsed
}

const hasSameUnit = (booking: Booking, user: User) => {
  const bookingApartment = normalizeApartment(booking.userApartment)
  const userApartment = normalizeApartment(user.apartment)
  if (!bookingApartment || !userApartment || bookingApartment !== userApartment) {
    return false
  }

  const bookingBlock = parseBlockNumber(booking.userBlock)
  const userBlock = parseBlockNumber(user.block)

  if (bookingBlock === null || userBlock === null) {
    return true
  }

  return bookingBlock === userBlock
}

const isBookedOnBehalfForUser = (booking: Booking, user: User) => {
  const onBehalf = normalizeText(booking.bookedOnBehalf)
  const userApartment = normalizeApartment(user.apartment)

  if (!onBehalf || !userApartment) {
    return false
  }

  const onBehalfApartment = normalizeApartment(onBehalf)
  if (onBehalfApartment === userApartment) {
    return true
  }

  const userBlock = parseBlockNumber(user.block)
  if (userBlock === null) {
    return onBehalfApartment.includes(userApartment)
  }

  return onBehalfApartment.includes(userApartment) && onBehalf.includes(String(userBlock))
}

export const isBookingForCurrentUser = (booking: Booking, user?: User | null) => {
  if (!user) return false

  const sameUserId = normalizeText(booking.userId) !== "" && normalizeText(booking.userId) === normalizeText(user.id)
  return sameUserId || hasSameUnit(booking, user) || isBookedOnBehalfForUser(booking, user)
}

export const isUpcomingBooking = (booking: Booking, referenceDate: Date = new Date()) => {
  return parseBookingDateTime(booking.endTime).getTime() > referenceDate.getTime()
}

export const compareBookingStartAsc = (a: Booking, b: Booking) => {
  return parseBookingDateTime(a.startTime).getTime() - parseBookingDateTime(b.startTime).getTime()
}
