import type React from "react"
import { useState, useEffect } from "react"
import "./Clock.css"

const Clock: React.FC = () => {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
    return date.toLocaleDateString("pt-BR", options)
  }

  return <div className="clock">{formatDate(date)}</div>
}

export default Clock

