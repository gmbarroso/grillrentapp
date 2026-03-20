export type ContactMessageCategory = "suggestion" | "complaint" | "question"
export type ContactMessageStatus = "unread" | "read" | "replied"
export type MessageEmailDeliveryStatus = "not_requested" | "pending" | "sent" | "failed" | "skipped"
export type MessageReplyOriginRole = "admin" | "resident"
export type MessageReplyOriginChannel = "in_app" | "email_inbound"

export interface MessageReply {
  id: string
  messageId: string
  authorUserId: string
  authorName: string
  originRole: MessageReplyOriginRole
  originChannel: MessageReplyOriginChannel
  content: string
  sendViaEmail: boolean
  emailDeliveryStatus: MessageEmailDeliveryStatus
  emailProviderMessageId?: string | null
  emailSentAt?: string | null
  emailLastError?: string | null
  externalMessageId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  senderUserId: string
  senderName: string
  senderEmail: string
  senderApartment?: string | null
  senderBlock?: number | null
  subject: string
  category: ContactMessageCategory
  content: string
  status: ContactMessageStatus
  readAt?: string | null
  adminEmailDeliveryStatus: MessageEmailDeliveryStatus
  adminEmailProviderMessageId?: string | null
  adminEmailSentAt?: string | null
  adminEmailLastError?: string | null
  organizationId?: string
  replies: MessageReply[]
  createdAt: string
  updatedAt: string
}
