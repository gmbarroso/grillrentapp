export interface User {
  id: string
  name: string
  email: string | null
  apartment: string
  block: number
  role: "resident" | "admin"
}

export interface OnboardingFlags {
  mustProvideEmail: boolean
  mustVerifyEmail: boolean
  mustChangePassword: boolean
  onboardingRequired: boolean
}

export interface TourState {
  firstAccessTourVersionCompleted: number | null
}

export interface UserResponse {
  message: string
  user: User
  onboarding?: OnboardingFlags
  tour?: TourState
  mustProvideEmail?: boolean
  mustVerifyEmail?: boolean
  mustChangePassword?: boolean
  onboardingRequired?: boolean
}
