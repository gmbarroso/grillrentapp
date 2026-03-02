import { describe, expect, it } from "vitest"
import { normalizeOrganizationSlug } from "./organizationSlug"

describe("normalizeOrganizationSlug", () => {
  it("trims input and lowercases", () => {
    expect(normalizeOrganizationSlug("  Condominio Norte  ")).toBe("condominio-norte")
  })

  it("removes diacritics", () => {
    expect(normalizeOrganizationSlug("Chácara São João")).toBe("chacara-sao-joao")
  })

  it("collapses non-alphanumerics into a single hyphen", () => {
    expect(normalizeOrganizationSlug("Apto__Bloco@@Norte")).toBe("apto-bloco-norte")
  })

  it("strips leading and trailing hyphens", () => {
    expect(normalizeOrganizationSlug("___Condominio___")).toBe("condominio")
  })

  it("returns empty string for all-symbol input", () => {
    expect(normalizeOrganizationSlug(" --- ___ !!! ")).toBe("")
  })
})
