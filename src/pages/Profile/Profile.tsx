"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, Lock, UserRound, Building2, Layers } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useUserProfile } from "../../hooks/user/useUserProfile"
import { useUpdateProfile } from "../../hooks/user/useUpdateProfile"
import { useLoading } from "../../context/LoadingContext"
import { LoadingSpinner, Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import "./Profile.css"

const Profile: React.FC = () => {
  const { token } = useAuth()
  const { data: userResponse, error: userError, isLoading: isUserLoading, fetchProfile } = useUserProfile(token)
  const { updateProfile, isLoading: isUpdating } = useUpdateProfile(token ?? "")
  const { showToast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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
    if (value.length > 50) return t("Profile.NameTooLong")
    if (!/^[a-zA-Z\s]*$/.test(value)) return t("Profile.NameInvalid")
    return null
  }

  const validateEmail = (value: string) => {
    if (value.length > 100) return t("Profile.EmailTooLong")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("Profile.EmailInvalid")
    return null
  }

  const validatePassword = (value: string) => {
    if (value && value.length > 8) return t("Profile.PasswordTooLong")
    if (value && !/^(?=.*[A-Za-z])(?=.*\d).{8,8}$/.test(value)) return t("Profile.PasswordInvalid")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameError = validateName(name)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (nameError || emailError || passwordError) {
      showToast((nameError || emailError || passwordError) ?? t("Profile.Error"), "error")
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
        showToast(t("Profile.Success"), "success")
        setPassword("")
        await fetchProfile()
      }
    } catch {
      showToast(t("Profile.Error"), "error")
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[0-9]/g, "")
    setName(value)
  }

  if (isUserLoading) return <LoadingSpinner />
  if (userError) return <div>{t("Profile.Error")}</div>
  if (!userResponse?.user) return <div>{t("Profile.UserNotFound")}</div>

  const user = userResponse.user

  return (
    <div className="profile-page">
      <section className="profile-card">
        <header>
          <h2>
            <UserRound size={18} />
            Editar Perfil
          </h2>
        </header>

        <form onSubmit={handleSubmit} className="profile-form-v2">
          <label htmlFor="profile-name">Nome</label>
          <div className="profile-input-wrap">
            <UserRound size={15} />
            <input id="profile-name" type="text" value={name} onChange={handleNameChange} required />
          </div>

          <label htmlFor="profile-email">Email</label>
          <div className="profile-input-wrap">
            <Mail size={15} />
            <input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <label htmlFor="profile-password">Nova Senha</label>
          <div className="profile-input-wrap">
            <Lock size={15} />
            <input
              id="profile-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={8}
              placeholder="Deixe em branco para manter a atual"
            />
          </div>

          <div className="profile-unit-row">
            <div>
              <label htmlFor="profile-apartment">Apartamento</label>
              <div className="profile-input-wrap readonly">
                <Building2 size={15} />
                <input id="profile-apartment" type="text" value={user.apartment} disabled />
              </div>
            </div>

            <div>
              <label htmlFor="profile-block">Bloco</label>
              <div className="profile-input-wrap readonly">
                <Layers size={15} />
                <input id="profile-block" type="text" value={user.block} disabled />
              </div>
            </div>
          </div>

          <Button variant="primary" type="submit" fullWidth>
            Atualizar Perfil
          </Button>
        </form>
      </section>
    </div>
  )
}

export default Profile
