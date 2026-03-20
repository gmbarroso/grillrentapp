"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type ThemeMode = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextType {
  theme: ResolvedTheme
  resolvedTheme: ResolvedTheme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const LEGACY_THEME_KEY = "theme"
const THEME_MODE_KEY = "theme-mode"

const resolveSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem(THEME_MODE_KEY)
      if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
        return savedMode
      }

      const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY)
      if (legacyTheme === "light" || legacyTheme === "dark") {
        return legacyTheme
      }
    }
    return "system"
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (themeMode === "system") return resolveSystemTheme()
    return themeMode
  })

  useEffect(() => {
    if (themeMode === "system") {
      setResolvedTheme(resolveSystemTheme())
      return
    }
    setResolvedTheme(themeMode)
  }, [themeMode])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolvedTheme

    document.body.classList.toggle("dark", resolvedTheme === "dark")
    document.body.classList.toggle("light", resolvedTheme === "light")

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const tokenColor = getComputedStyle(root).getPropertyValue("--surface-elevated").trim()
      if (tokenColor) {
        metaThemeColor.setAttribute("content", tokenColor)
      }
    }
  }, [resolvedTheme])

  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, themeMode)
    if (themeMode === "light" || themeMode === "dark") {
      localStorage.setItem(LEGACY_THEME_KEY, themeMode)
    }
  }, [themeMode])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      if (themeMode === "system") {
        setResolvedTheme(media.matches ? "dark" : "light")
      }
    }

    media.addEventListener("change", onChange)
    return () => {
      media.removeEventListener("change", onChange)
    }
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prevMode) => {
      if (prevMode === "system") {
        return resolvedTheme === "light" ? "dark" : "light"
      }
      return prevMode === "light" ? "dark" : "light"
    })
  }

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, resolvedTheme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
