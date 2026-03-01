export const BOOKING_DISPLAY_TIMEZONE = "America/Sao_Paulo"

const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

const normalizeIsoLikeInput = (value: string) => {
  if (value.includes("T")) {
    return value
  }
  if (value.includes(" ")) {
    return value.replace(" ", "T")
  }
  return value
}

export const parseBookingDateTime = (value: string | Date) => {
  if (value instanceof Date) {
    return value
  }

  const raw = value.trim()
  const normalized = normalizeIsoLikeInput(raw)

  if (DATE_ONLY_REGEX.test(normalized)) {
    throw new Error("Date-only values are not supported for booking datetime parsing")
  }

  if (HAS_TIMEZONE_SUFFIX.test(normalized)) {
    return new Date(normalized)
  }

  return new Date(`${normalized}Z`)
}

export const formatBookingDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const formatBookingDate = (value: string | Date, locale: string = "en-GB") => {
  return parseBookingDateTime(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: BOOKING_DISPLAY_TIMEZONE,
  })
}

export const formatBookingHour = (value: string | Date, padHour: boolean = false) => {
  const formattedHour = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: BOOKING_DISPLAY_TIMEZONE,
  }).format(parseBookingDateTime(value))

  return padHour ? formattedHour : String(Number.parseInt(formattedHour, 10))
}

export const formatBookingHourSlot = (value: string | Date) => {
  return `${formatBookingHour(value, true)}:00`
}

export const formatBookingTimeInterval = (startTime: string | Date, endTime: string | Date) => {
  const startHour = formatBookingHour(startTime)
  const endHour = formatBookingHour(endTime)
  return `${startHour}h - ${endHour}h`
}
