export function isTokenExpired(token: string | null): boolean {
    if (!token) return true
  
    try {
      const payload = token.split(".")[1]

      const decodedPayload = window.atob(payload)

      const { exp } = JSON.parse(decodedPayload)
  
      return Date.now() >= exp * 1000
    } catch (error) {
      console.error("Error checking token expiration:", error)
      
      return true
    }
  }
  
  