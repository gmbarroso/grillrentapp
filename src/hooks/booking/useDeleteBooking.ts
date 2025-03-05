import { useState, useCallback } from "react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export function useDeleteBooking(token: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteBooking = useCallback(
    async (bookingId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || `Failed to delete booking: ${response.status}`)
        }

        setIsLoading(false)
        return { success: true, data }
      } catch (err) {
        console.error("Error in deleteBooking:", err)
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        setIsLoading(false)
        return { success: false, error: err instanceof Error ? err : new Error("An unknown error occurred") }
      }
    },
    [token],
  )

  return { deleteBooking, isLoading, error }
}

