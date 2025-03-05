export interface User {
  id: string
  name: string
  email: string
  apartment: string
  block: number
  role: "resident" | "admin"
}

export interface UserResponse {
  message: string
  user: User
}
