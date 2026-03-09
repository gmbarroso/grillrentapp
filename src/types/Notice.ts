export interface Notice {
    id: string
    title: string
    subtitle: string
    content: string
    sendViaWhatsapp?: boolean
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
  
  
