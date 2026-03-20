export interface OrganizationSettings {
  id: string
  name: string
  slug: string
  address?: string | null
  email?: string | null
  phone?: string | null
  businessHours?: string | null
  timezone: string
  openingTime?: string | null
  closingTime?: string | null
  logoUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UpdateOrganizationSettingsPayload {
  name?: string
  address?: string | null
  email?: string | null
  phone?: string | null
  businessHours?: string | null
  timezone?: string
  openingTime?: string | null
  closingTime?: string | null
  logoUrl?: string | null
}
