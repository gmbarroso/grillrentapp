import { useCallback } from "react"
import { useFetch } from "../useFetch"
import { fetchWithAuthHandling, extractApiErrorMessage, getApiBaseUrl, handleApiError, logApiRequest, logApiResponse } from "../../utils/api"
import type { OrganizationSettings, UpdateOrganizationSettingsPayload } from "../../types"

const API_BASE_URL = getApiBaseUrl()
const ORGANIZATION_ENDPOINT = `${API_BASE_URL}/organizations/current`

const normalizeNullable = (value?: string | null): string | null | undefined => {
  if (value === undefined) return undefined
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function useOrganizationSettings() {
  const fetcher = useCallback(async (endpoint: string): Promise<OrganizationSettings> => {
    logApiRequest("GET", endpoint)

    try {
      const response = await fetchWithAuthHandling(endpoint)
      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Failed to fetch organization settings: ${response.status}`)
        throw new Error(message)
      }

      const payload = (await response.json()) as OrganizationSettings
      logApiResponse(endpoint, response.status, payload)
      return payload
    } catch (error) {
      throw handleApiError(error, endpoint)
    }
  }, [])

  const { data, isError, isLoading, mutate } = useFetch<OrganizationSettings>(ORGANIZATION_ENDPOINT, { fetcher })

  const updateOrganization = useCallback(
    async (payload: UpdateOrganizationSettingsPayload) => {
      const normalizedPayload: UpdateOrganizationSettingsPayload = {
        ...payload,
        name: payload.name?.trim(),
        address: normalizeNullable(payload.address),
        email: normalizeNullable(payload.email),
        phone: normalizeNullable(payload.phone),
        businessHours: normalizeNullable(payload.businessHours),
        timezone: payload.timezone?.trim(),
        openingTime: normalizeNullable(payload.openingTime),
        closingTime: normalizeNullable(payload.closingTime),
        logoUrl: normalizeNullable(payload.logoUrl),
      }

      logApiRequest("PUT", ORGANIZATION_ENDPOINT, normalizedPayload)

      try {
        const response = await fetchWithAuthHandling(ORGANIZATION_ENDPOINT, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(normalizedPayload),
        })

        if (!response.ok) {
          const message = await extractApiErrorMessage(response, `Failed to update organization settings: ${response.status}`)
          throw new Error(message)
        }

        const updated = (await response.json()) as OrganizationSettings
        logApiResponse(ORGANIZATION_ENDPOINT, response.status, updated)
        await mutate(updated, false)
        return updated
      } catch (error) {
        throw handleApiError(error, ORGANIZATION_ENDPOINT)
      }
    },
    [mutate],
  )

  return {
    organization: data,
    isLoading,
    isError,
    updateOrganization,
    mutate,
  }
}
