import { describe, expect, it } from "vitest"
import { meetsPasswordPolicy } from "./passwordPolicy"

describe("password policy", () => {
  it("accepts a valid password at the minimum length", () => {
    expect(meetsPasswordPolicy("Abcdef1!")).toBe(true)
  })

  it("accepts a valid password at the maximum length", () => {
    expect(meetsPasswordPolicy(`A1!${"a".repeat(97)}`)).toBe(true)
  })

  it("rejects passwords shorter than eight characters", () => {
    expect(meetsPasswordPolicy("Abc1!xy")).toBe(false)
  })

  it("rejects passwords longer than one hundred characters", () => {
    expect(meetsPasswordPolicy(`A1!${"a".repeat(98)}`)).toBe(false)
  })

  it("rejects passwords without an uppercase letter", () => {
    expect(meetsPasswordPolicy("abcdef1!")).toBe(false)
  })

  it("rejects passwords without a digit", () => {
    expect(meetsPasswordPolicy("Abcdefg!")).toBe(false)
  })

  it("rejects passwords without a special character", () => {
    expect(meetsPasswordPolicy("Abcdefg1")).toBe(false)
  })

  it("rejects passwords containing whitespace", () => {
    expect(meetsPasswordPolicy("Abcde 1!")).toBe(false)
  })
})