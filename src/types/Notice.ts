export type NoticeWhatsappDeliveryStatus =
  | "not_requested"
  | "pending"
  | "retrying"
  | "sent"
  | "failed"
  | "skipped"

export interface Notice {
  id: string
  title: string
  subtitle: string
  content: string
  sendViaWhatsapp?: boolean
  whatsappDeliveryStatus?: NoticeWhatsappDeliveryStatus
  whatsappAttemptCount?: number
  whatsappLastAttemptAt?: string
  whatsappSentAt?: string
  whatsappProviderMessageId?: string
  whatsappLastError?: string
  createdAt: string
  updatedAt: string
  authorId: string
  authorName: string
}

export interface CreateNoticeDto {
  title: string
  subtitle: string
  content: string
  sendViaWhatsapp?: boolean
}

export interface UpdateNoticeDto {
  title?: string
  subtitle?: string
  content?: string
}
  


