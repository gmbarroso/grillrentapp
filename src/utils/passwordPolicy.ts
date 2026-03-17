export const PASSWORD_POLICY_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=\S+$).{8,100}$/

export const PASSWORD_POLICY_MESSAGE =
  "Use 8+ characters, with at least 1 uppercase letter, 1 number, and 1 special character."

export const meetsPasswordPolicy = (password: string) => PASSWORD_POLICY_REGEX.test(password)
