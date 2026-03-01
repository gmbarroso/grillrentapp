import { describe, expect, it } from "vitest"
import {
  formatBookingDate,
  formatBookingDateKey,
  formatBookingHour,
  formatBookingHourSlot,
  formatBookingTimeInterval,
  parseBookingDateTime,
} from "./booking-datetime"

describe("booking datetime utils", () => {
  it("parses ISO timestamps with explicit timezone", () => {
    const parsed = parseBookingDateTime("2026-03-02T11:00:00.000Z")
    expect(parsed.toISOString()).toBe("2026-03-02T11:00:00.000Z")
  })

  it("treats timezone-less timestamps as UTC", () => {
    const parsed = parseBookingDateTime("2026-03-02T11:00:00.000")
    expect(parsed.toISOString()).toBe("2026-03-02T11:00:00.000Z")
  })

  it("supports space-separated timestamp strings", () => {
    const parsed = parseBookingDateTime("2026-03-02 11:00:00")
    expect(parsed.toISOString()).toBe("2026-03-02T11:00:00.000Z")
  })

  it("throws on date-only values", () => {
    expect(() => parseBookingDateTime("2026-03-02")).toThrow("Date-only values are not supported")
  })

  it("formats booking hours in America/Sao_Paulo", () => {
    const utcValue = "2026-03-02T11:00:00.000Z"
    expect(formatBookingHour(utcValue)).toBe("8")
    expect(formatBookingHour(utcValue, true)).toBe("08")
    expect(formatBookingHourSlot(utcValue)).toBe("08:00")
  })

  it("formats date and time interval in America/Sao_Paulo", () => {
    expect(formatBookingDate("2026-03-02T11:00:00.000Z")).toBe("02/03/2026")
    expect(formatBookingTimeInterval("2026-03-03T00:00:00.000Z", "2026-03-03T01:00:00.000Z")).toBe("21h - 22h")
  })

  it("formats date key with zero-padding", () => {
    expect(formatBookingDateKey(new Date("2026-03-05T12:00:00.000Z"))).toBe("2026-03-05")
    expect(formatBookingDateKey(new Date("2026-11-15T12:00:00.000Z"))).toBe("2026-11-15")
  })

  it("formats date key correctly across year rollover", () => {
    expect(formatBookingDateKey(new Date("2026-12-31T12:00:00.000Z"))).toBe("2026-12-31")
    expect(formatBookingDateKey(new Date("2027-01-01T12:00:00.000Z"))).toBe("2027-01-01")
  })
})
