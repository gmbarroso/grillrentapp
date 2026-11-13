export interface OrganizationSettings {
  id: string
  showNameInSidebar?: boolean
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
  showNameInSidebar?: boolean
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
