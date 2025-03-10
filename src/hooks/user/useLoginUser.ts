import { useFetch } from "../useFetch"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useLoginUser() {
  const { data, isError, isLoading, mutate } = useFetch(null)

  const login = async (body: { apartment: string, block: number, password: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    return result
  }

  return {
    data,
    error: isError,
    isLoading,
    login,
  }
}
