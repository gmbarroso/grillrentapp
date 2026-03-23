export const PASSWORD_POLICY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=\S+$).{8,100}$/

export const PASSWORD_POLICY_MESSAGE =
  "Use 8+ caracteres, com pelo menos 1 letra maiúscula, 1 número e 1 caractere especial."

export const meetsPasswordPolicy = (password: string) => PASSWORD_POLICY_REGEX.test(password)
