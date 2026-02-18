export type ConversionStatus = 'ready' | 'converting' | 'complete' | 'error'

export type ConversionQuality = 'standard' | 'high' | 'maximum'

export interface ConversionFile {
  id: string
  file: File
  name: string
  size: number
  status: ConversionStatus
  progress: number
  thumbnailUrl?: string
  pdfUrl?: string
  error?: string
  slideCount?: number
}

export interface ConversionSettings {
  quality: ConversionQuality
  maintainAspectRatio: boolean
  includeNotes: boolean
  compression: number
  enableOCR: boolean
  ocrLanguage: string
}

export interface ConversionHistory {
  id: string
  fileName: string
  convertedAt: number
  pdfUrl: string
  originalSize: number
  pdfSize: number
}
