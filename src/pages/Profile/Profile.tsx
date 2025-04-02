"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useUserProfile } from "../../hooks/user/useUserProfile"
import { useUpdateProfile } from "../../hooks/user/useUpdateProfile"
import { useLoading } from "../../context/LoadingContext"
import { LoadingSpinner, Tooltip, Toast, Button } from "../../components"
import "./Profile.css"

const Profile: React.FC = () => {
  const { token, logout } = useAuth()
  const { data: userResponse, error: userError, isLoading: isUserLoading, fetchProfile } = useUserProfile(token)
  const { updateProfile, isLoading: isUpdating, error: updateError, canDeleteProfile } = useUpdateProfile(token ?? "")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const { t } = useTranslation()
  const { setIsLoading } = useLoading()

  useEffect(() => {
    setIsLoading(isUserLoading || isUpdating)
  }, [isUserLoading, isUpdating, setIsLoading])

  useEffect(() => {
    if (userResponse?.user) {
      setName(userResponse.user.name)
      setEmail(userResponse.user.email)
    }
  }, [userResponse])

  const validateName = (value: string) => {
    if (value.length > 50) {
      return t("Profile.NameTooLong")
    }
    if (!/^[a-zA-Z\s]*$/.test(value)) {
      return t("Profile.NameInvalid")
    }
    return null
  }

  const validateEmail = (value: string) => {
    if (value.length > 100) {
      return t("Profile.EmailTooLong")
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t("Profile.EmailInvalid")
    }
    return null
  }

  const validatePassword = (value: string) => {
    if (value && value.length > 8) {
      return t("Profile.PasswordTooLong")
    }
    if (value && !/^(?=.*[A-Za-z])(?=.*\d).{8,8}$/.test(value)) {
      return t("Profile.PasswordInvalid")
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const nameError = validateName(name)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (nameError || emailError || passwordError) {
      setToast({ message: (nameError || emailError || passwordError)!, type: "error" })
      setIsLoading(false)
      return
    }

    const updateData = {
      name,
      email,
      ...(password ? { password } : {}),
    }

    try {
      const updatedUser = await updateProfile(updateData)
      if (updatedUser) {
        setToast({ message: t("Profile.Success"), type: "success" })
        setPassword("")
        fetchProfile()
      }
    } catch (err) {
      setToast({ message: t("Profile.Error"), type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[0-9]/g, "")
    setName(value)
  }

  if (isUserLoading) {
    return <LoadingSpinner />
  }

  if (userError) {
    return <div>{t("Profile.Error")}</div>
  }

  if (!userResponse?.user) {
    return <div>{t("Profile.UserNotFound")}</div>
  }

  const user = userResponse.user

  return (
    <div className="profile-container">
      <h2>{t("Profile.Title")}</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="input-group">
          <input type="text" placeholder={t("Profile.Name")} value={name} onChange={handleNameChange} required />
          <Tooltip content={t("Profile.NameTooltip")} />
        </div>
        <div className="input-group">
          <input
            type="email"
            placeholder={t("Profile.Email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Tooltip content={t("Profile.EmailTooltip")} />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder={t("Profile.NewPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={8}
          />
          <Tooltip content={t("Profile.PasswordTooltip")} />
        </div>
        <div className="input-group">
          <input type="text" placeholder={t("Profile.Apartment")} value={user.apartment} disabled />
          <Tooltip content={t("Profile.ApartmentTooltip")} />
        </div>
        <div className="input-group">
          <input type="text" placeholder={t("Profile.Block")} value={user.block} disabled />
          <Tooltip content={t("Profile.BlockTooltip")} />
        </div>
        <Button variant="secondary" type="submit" fullWidth>
          {t("Profile.Update")}
        </Button>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Profile

