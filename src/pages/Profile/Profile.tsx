"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mail, UserRound, Building2, Layers } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../context/AuthContext"
import { useUserProfile } from "../../hooks/user/useUserProfile"
import { useUpdateProfile } from "../../hooks/user/useUpdateProfile"
import { useLoading } from "../../context/LoadingContext"
import { ProfilePageSkeleton, Button, TourPageHint } from "../../components"
import { useToast } from "../../context/ToastContext"
import { extractApiErrorMessage, fetchWithAuthHandling, getApiBaseUrl, handleApiError } from "../../utils/api"
import "./Profile.css"

const API_BASE_URL = getApiBaseUrl()

const Profile: React.FC = () => {
  const { token } = useAuth()
  const { data: userResponse, error: userError, isLoading: isUserLoading, fetchProfile } = useUserProfile(token)
  const { updateProfile, setOnboardingEmail, isLoading: isUpdating } = useUpdateProfile(token ?? "")
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isResettingTour, setIsResettingTour] = useState(false)

  const { t } = useTranslation()
  const { setIsLoading } = useLoading()

  useEffect(() => {
    setIsLoading(isUserLoading || isUpdating)
  }, [isUserLoading, isUpdating, setIsLoading])

  useEffect(() => {
    if (userResponse?.user) {
      setName(userResponse.user.name)
      setEmail(userResponse.user.email || "")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameError = validateName(name)
    const emailError = validateEmail(email)

    if (nameError || emailError) {
      showToast((nameError || emailError) ?? t("Profile.Error"), "error")
      return
    }

    const currentEmail = (userResponse?.user.email || "").trim().toLowerCase()
    const nextEmail = email.trim().toLowerCase()
    const hasNameChanged = name !== userResponse?.user.name
    const hasEmailChanged = nextEmail !== currentEmail

    try {
      if (!hasNameChanged && !hasEmailChanged) {
        showToast("Nenhuma alteração para salvar.", "success")
        return
      }

      if (hasNameChanged) {
        const response = await updateProfile({ name })
        if (!response?.user) {
          throw new Error(t("Profile.Error"))
        }
      }

      if (hasEmailChanged) {
        const response = await setOnboardingEmail(nextEmail)
        if (!response) {
          throw new Error(t("Profile.Error"))
        }
      }

      await fetchProfile()
      if (hasEmailChanged) {
        showToast("E-mail atualizado. Verifique o novo e-mail para continuar.", "success")
        navigate("/onboarding/verify-email")
        return
      }
      showToast(t("Profile.Success"), "success")
    } catch {
      showToast(t("Profile.Error"), "error")
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[0-9]/g, "")
    setName(value)
  }

  const handleRepeatTour = async () => {
    try {
      setIsResettingTour(true)
      const response = await fetchWithAuthHandling(`${API_BASE_URL}/users/tour/reset`, {
        method: "POST",
      })

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, `Falha ao resetar tour (${response.status})`)
        throw new Error(message)
      }

      await fetchProfile()
      showToast("Tour resetado. Vamos te guiar novamente no painel.", "success")
      navigate("/?startTour=1")
    } catch (error) {
      console.error(handleApiError(error, "/users/tour/reset"))
      showToast(error instanceof Error ? error.message : "Não foi possível resetar o tour agora.", "error")
    } finally {
      setIsResettingTour(false)
    }
  }

  if (isUserLoading) return <ProfilePageSkeleton />
  if (userError) return <div>{t("Profile.Error")}</div>
  if (!userResponse?.user) return <div>{t("Profile.UserNotFound")}</div>

  const user = userResponse.user

  return (
    <div className="profile-page">
      <TourPageHint
        title="Perfil"
        description="Nesta pagina voce atualiza nome e email, pode alterar senha e repetir o tour de boas-vindas."
        stepIndex={7}
        totalSteps={10}
        backTo="/mybookeddates?startTour=1&tourStep=6"
        nextTo="/contact?startTour=1&tourStep=8"
      />
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

          <Button variant="primary" type="submit" fullWidth isLoading={isUpdating} loadingText="Atualizando...">
            Atualizar Perfil
          </Button>
          <Button variant="primary" type="button" fullWidth onClick={() => navigate("/change-password")}>
            Alterar senha
          </Button>
          <Button
            variant="secondary"
            type="button"
            fullWidth
            onClick={handleRepeatTour}
            isLoading={isResettingTour}
            loadingText="Resetando..."
          >
            Repetir tour de boas-vindas
          </Button>
        </form>
      </section>
    </div>
  )
}

export default Profile
