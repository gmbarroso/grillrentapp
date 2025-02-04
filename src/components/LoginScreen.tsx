import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./LoginScreen.css"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Here you would typically make an API call to your backend
      // For demonstration, we'll use a mock API call
      const response = await mockLoginApi(email, password)
      login(response.token, response.user)
      navigate("/dashboard")
    } catch (err) {
      setError("Login failed. Please check your credentials and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Mock API call - replace this with your actual API call
  const mockLoginApi = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "test@example.com" && password === "password") {
          resolve({
            token: "mock-jwt-token",
            user: { id: 1, name: "Test User", email: "test@example.com" },
          })
        } else {
          reject(new Error("Invalid credentials"))
        }
      }, 1000)
    })
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="title">Sign in to your account</h2>
        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  )
}

