import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Building2, Hash, Mail, MapPin, Phone, User } from "lucide-react"
import { BrandMark } from "../../components"
import { useRegisterUser } from "../../hooks/user/useRegisterUser"
import { normalizeOrganizationSlug } from "../../utils/organizationSlug"
import { meetsPasswordPolicy } from "../../utils/passwordPolicy"
import "./SignUp.css"

type Step = 1 | 2 | 3 | 4

const DEFAULT_APARTMENT = "000"
const DEFAULT_BLOCK = "1"
const PASSWORD_POLICY_HINT = "Use 8+ caracteres com 1 letra maiúscula, 1 número e 1 caractere especial."

const SignUp = () => {
  const navigate = useNavigate()
  const { register, isLoading } = useRegisterUser()

  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [organizationName, setOrganizationName] = useState("")
  const [organizationSlug, setOrganizationSlug] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const normalizedOrganizationSlug = useMemo(() => normalizeOrganizationSlug(organizationSlug), [organizationSlug])

  const goToStepTwo = () => {
    setError(null)

    if (!organizationName.trim()) {
      setError("Informe o nome do condomínio.")
      return
    }

    if (!normalizedOrganizationSlug) {
      setError("Código do condomínio inválido. Use apenas letras e números.")
      return
    }

    setStep(2)
  }

  const goToStepThree = () => {
    setError(null)

    if (!name.trim() || !email.trim()) {
      setError("Preencha nome e e-mail do administrador.")
      return
    }

    if (!meetsPasswordPolicy(password)) {
      setError("Senha invalida. " + PASSWORD_POLICY_HINT)
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.")
      return
    }

    setStep(3)
  }

  const createOrganization = async () => {
    setError(null)

    if (!normalizedOrganizationSlug) {
      setError("Código do condomínio inválido. Revise e tente novamente.")
      return
    }

    try {
      await register({
        organizationSlug: normalizedOrganizationSlug,
        name,
        email,
        password,
        apartment: DEFAULT_APARTMENT,
        block: Number.parseInt(DEFAULT_BLOCK, 10),
      })

      setStep(4)
    } catch (err: unknown) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code || "") : ""
      if (code === "INVALID_CONDOMINIUM_CODE") {
        setError("Código do condomínio inválido.")
        return
      }
      setError("Não foi possível criar o condomínio. Tente novamente.")
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-page-decoration signup-page-decoration-top" aria-hidden="true" />
      <div className="signup-page-decoration signup-page-decoration-bottom" aria-hidden="true" />
      <main className="signup-flow">
        <div className="signup-brand">
          <BrandMark compact className="signup-brand-mark" />
        </div>

        {step === 1 && (
          <>
            <header className="signup-header">
              <h2>Cadastrar condomínio</h2>
              <p>Informe os dados do seu condomínio para criar uma nova organização.</p>
            </header>
            <div className="signup-progress">
              <span className="active" />
              <span />
              <span />
            </div>
            <section className="signup-card">
              <div className="signup-field">
                <label>Nome do condomínio</label>
                <div className="signup-input-wrap">
                  <Building2 size={16} />
                  <input
                    type="text"
                    placeholder="Ex: Residencial Flores"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
              </div>
              <div className="signup-field">
                <label>Código do condomínio</label>
                <div className="signup-input-wrap">
                  <Hash size={16} />
                  <input
                    type="text"
                    placeholder="Ex: FLORES"
                    value={organizationSlug}
                    onChange={(e) => setOrganizationSlug(e.target.value)}
                  />
                </div>
                <small>Código único usado pelos moradores para acessar o sistema.</small>
              </div>
              <div className="signup-field">
                <label>Endereço</label>
                <div className="signup-input-wrap">
                  <MapPin size={16} />
                  <input type="text" placeholder="Ex: Rua das Flores, 123" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="signup-field">
                <label>Telefone</label>
                <div className="signup-input-wrap">
                  <Phone size={16} />
                  <input type="text" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {error && <p className="signup-error">{error}</p>}
              <button type="button" className="signup-primary" onClick={goToStepTwo}>
                Proximo <ArrowRight size={16} />
              </button>
            </section>
          </>
        )}

        {step === 2 && (
          <>
            <header className="signup-header">
              <h2>Administrador</h2>
              <p>Dados do primeiro administrador do condomínio.</p>
            </header>
            <div className="signup-progress">
              <span className="active" />
              <span className="active" />
              <span />
            </div>
            <section className="signup-card">
              <div className="signup-field">
                <label>Nome completo</label>
                <div className="signup-input-wrap">
                  <User size={16} />
                  <input type="text" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="signup-field">
                <label>E-mail</label>
                <div className="signup-input-wrap">
                  <Mail size={16} />
                  <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="signup-inline">
                <div className="signup-field">
                  <label>Apartamento</label>
                  <input type="text" value={DEFAULT_APARTMENT} readOnly disabled className="signup-input-disabled" />
                </div>
                <div className="signup-field">
                  <label>Bloco</label>
                  <input type="text" value={DEFAULT_BLOCK} readOnly disabled className="signup-input-disabled" />
                </div>
              </div>
              <div className="signup-field">
                <label>Senha</label>
                <div className="signup-input-wrap signup-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="signup-password-toggle" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <small>{PASSWORD_POLICY_HINT}</small>
              </div>
              <div className="signup-field">
                <label>Confirmar senha</label>
                <div className="signup-input-wrap signup-password-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" className="signup-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)}>
                    {showConfirmPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
              {error && <p className="signup-error">{error}</p>}
              <div className="signup-actions">
                <button type="button" className="signup-secondary" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button type="button" className="signup-primary" onClick={goToStepThree}>
                  Proximo <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </>
        )}

        {step === 3 && (
          <>
            <header className="signup-header">
              <h2>Revisao</h2>
              <p>Confirme os dados antes de finalizar o cadastro.</p>
            </header>
            <div className="signup-progress">
              <span className="active" />
              <span className="active" />
              <span className="active" />
            </div>
            <section className="signup-card">
              <div className="signup-review-group">
                <h3>Condomínio</h3>
                <dl>
                  <dt>Nome</dt>
                  <dd>{organizationName}</dd>
                  <dt>Codigo</dt>
                  <dd>{normalizedOrganizationSlug || "-"}</dd>
                  <dt>Endereco</dt>
                  <dd>{address || "-"}</dd>
                  <dt>Telefone</dt>
                  <dd>{phone || "-"}</dd>
                </dl>
              </div>
              <div className="signup-review-group">
                <h3>Administrador</h3>
                <dl>
                  <dt>Nome</dt>
                  <dd>{name}</dd>
                  <dt>E-mail</dt>
                  <dd>{email}</dd>
                  <dt>Apartamento</dt>
                  <dd>
                    {DEFAULT_APARTMENT}, Bloco {DEFAULT_BLOCK}
                  </dd>
                  <dt>Permissão</dt>
                  <dd>Administrador</dd>
                </dl>
              </div>
              {error && <p className="signup-error">{error}</p>}
              <div className="signup-actions">
                <button type="button" className="signup-secondary" onClick={() => setStep(2)} disabled={isLoading}>
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button type="button" className="signup-primary" onClick={createOrganization} disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar condomínio"}
                </button>
              </div>
            </section>
          </>
        )}

        {step === 4 && (
          <>
            <header className="signup-header">
              <h2>Condomínio criado</h2>
              <p>Seu condomínio foi cadastrado com sucesso.</p>
            </header>
            <section className="signup-card signup-success-card">
              <div className="signup-success-icon">✓</div>
              <h3>{organizationName}</h3>
              <p>
                Seu condomínio foi criado com o código <b>{normalizedOrganizationSlug}</b>.
              </p>
              <p>
                Faça login com o código <b>{normalizedOrganizationSlug}</b>, apto <b>{DEFAULT_APARTMENT}</b>, bloco <b>{DEFAULT_BLOCK}</b> e a senha que você cadastrou.
              </p>
              <button type="button" className="signup-primary" onClick={() => navigate("/login")}>
                Ir para o login
              </button>
            </section>
          </>
        )}

        {step !== 4 && (
          <p className="signup-link-login">
            <button type="button" onClick={() => navigate("/login")}>
              <ArrowLeft size={14} /> Já tenho uma conta
            </button>
          </p>
        )}
        <p className="signup-caption">Sistema de Gestão Condominial</p>
      </main>
    </div>
  )
}

export default SignUp
