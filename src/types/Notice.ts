export interface Notice {
    id: string
    title: string
    subtitle: string
    content: string
    createdAt: string
    updatedAt: string
    authorId: string
    authorName: string
  }
  
  export interface CreateNoticeDto {
    title: string
    subtitle: string
    content: string
  }
  
  export interface UpdateNoticeDto {
    title?: string
    subtitle?: string
    content?: string
  }
  
  