import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../../components"
import { useToast } from "../../context/ToastContext"
import { useChangePassword } from "../../hooks/user/useChangePassword"
import { meetsPasswordPolicy, PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy"
import "./ChangePassword.css"

export default function ChangePassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { changePassword, isLoading } = useChangePassword()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast("A confirmação da nova senha não confere.", "error")
      return
    }
    if (currentPassword === newPassword) {
      showToast("A nova senha deve ser diferente da senha atual.", "error")
      return
    }
    if (!meetsPasswordPolicy(newPassword)) {
      showToast(PASSWORD_POLICY_MESSAGE, "error")
      return
    }

    try {
      await changePassword({ currentPassword, newPassword })
      showToast("Senha atualizada com sucesso.", "success")
      navigate("/profile")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível alterar a senha.", "error")
    }
  }

  return (
    <div className="change-password-page">
      <section className="change-password-card">
        <h2>Alterar senha</h2>
        <p>Atualize a senha da sua conta. Sua senha atual é obrigatória.</p>
        <ul className="change-password-rules">
          <li>{PASSWORD_POLICY_MESSAGE}</li>
          <li>A nova senha deve ser diferente da senha atual.</li>
          <li>A confirmação deve ser igual à nova senha.</li>
        </ul>

        <form className="change-password-form" onSubmit={submit}>
          <label htmlFor="current-password">
            Senha atual
            <div className="change-password-input-wrap">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                minLength={8}
                required
              />
              <button type="button" className="change-password-toggle" onClick={() => setShowCurrentPassword((value) => !value)}>
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label htmlFor="new-password">
            Nova senha
            <div className="change-password-input-wrap">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                required
              />
              <button type="button" className="change-password-toggle" onClick={() => setShowNewPassword((value) => !value)}>
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label htmlFor="confirm-password">
            Confirmar nova senha
            <div className="change-password-input-wrap">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                required
              />
              <button type="button" className="change-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="change-password-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/profile")} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} isLoading={isLoading} loadingText="Salvando...">
              Salvar senha
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
