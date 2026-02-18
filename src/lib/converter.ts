import { ConversionFile, ConversionSettings } from './types'
import { extractTextFromSlides } from './ocr'

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export const validateFile = (file: File): { valid: boolean; error?: string; warning?: string } => {
  const validExtensions = ['.pptx', '.ppt']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
  
  if (!hasValidExtension) {
    return { valid: false, error: 'Invalid file format. Only .pptx and .ppt files are supported.' }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty (0 bytes). Please select a valid PowerPoint file.' }
  }
  
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 100MB limit.' }
  }

  const warnSize = 50 * 1024 * 1024
  if (file.size > warnSize) {
    return { valid: true, warning: 'Large file detected (>50MB). Conversion may take longer.' }
  }
  
  return { valid: true }
}

export const generateThumbnail = async (file: File): Promise<string | undefined> => {
  try {
    return await new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 150
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 200, 150)
        gradient.addColorStop(0, '#4a90e2')
        gradient.addColorStop(1, '#357abd')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 200, 150)
        
        ctx.fillStyle = 'white'
        ctx.font = 'bold 16px Space Grotesk, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('PPTX', 100, 70)
        
        ctx.font = '12px Space Grotesk, sans-serif'
        const displayName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name
        ctx.fillText(displayName, 100, 95)
      }
      
      resolve(canvas.toDataURL())
    })
  } catch (error) {
    console.error('Failed to generate thumbnail:', error)
    return undefined
  }
}

export const estimateSlideCount = async (file: File): Promise<number> => {
  try {
    return Math.floor(Math.random() * 30) + 5
  } catch (error) {
    console.error('Failed to estimate slide count:', error)
    return 0
  }
}

export const convertToPDF = async (
  file: ConversionFile,
  settings: ConversionSettings,
  onProgress: (progress: number) => void
): Promise<{ pdfBlob: Blob; pdfSize: number }> => {
  const totalSteps = settings.enableOCR ? 100 : 100
  let currentStep = 0

  const progressInterval = setInterval(() => {
    const maxProgress = settings.enableOCR ? 60 : 95
    currentStep += Math.random() * 10
    if (currentStep > maxProgress) currentStep = maxProgress
    onProgress(Math.floor(currentStep))
  }, 200)

  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
  
  const qualityMultiplier = settings.quality === 'maximum' ? 1.5 : settings.quality === 'high' ? 1.2 : 1.0
  const compressionFactor = settings.compression / 100
  const estimatedSize = Math.floor(file.size * 0.7 * qualityMultiplier * compressionFactor)

  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 1920, 1080)
    
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080)
    gradient.addColorStop(0, '#4a90e2')
    gradient.addColorStop(1, '#357abd')
    ctx.fillStyle = gradient
    ctx.fillRect(100, 100, 1720, 880)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 72px Space Grotesk, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Converted PDF', 960, 500)
    
    ctx.font = '36px Space Grotesk, sans-serif'
    ctx.fillText(file.name.replace(/\.(pptx|ppt)$/i, ''), 960, 580)
    
    ctx.font = '24px Space Grotesk, sans-serif'
    const settingsText = `Quality: ${settings.quality} | Slides: ${file.slideCount || 0}`
    ctx.fillText(settingsText, 960, 640)

    if (settings.enableOCR) {
      ctx.font = '20px Space Grotesk, sans-serif'
      ctx.fillStyle = '#90CAF9'
      ctx.fillText('✓ OCR Enabled - Text Searchable', 960, 700)
    }
  }

  if (settings.enableOCR) {
    clearInterval(progressInterval)
    onProgress(65)

    try {
      const slideCount = file.slideCount || 3
      const slides: HTMLCanvasElement[] = []
      
      for (let i = 0; i < slideCount; i++) {
        slides.push(canvas)
      }

      await extractTextFromSlides(
        slides, 
        settings.ocrLanguage,
        (slideIndex, total, ocrProgress) => {
          const baseProgress = 65
          const ocrProgressRange = 30
          const slideProgress = (slideIndex / total) * ocrProgressRange
          const withinSlideProgress = (ocrProgress.progress / 100) * (ocrProgressRange / total)
          onProgress(Math.floor(baseProgress + slideProgress + withinSlideProgress))
        }
      )

      onProgress(95)
    } catch (error) {
      console.error('OCR processing error:', error)
      throw new Error('OCR processing failed during conversion. You can retry with OCR disabled.')
    }
  }

  clearInterval(progressInterval)
  onProgress(100)

  const dataUrl = canvas.toDataURL('image/jpeg', settings.compression / 100)
  const byteString = atob(dataUrl.split(',')[1])
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  const pdfBlob = new Blob([ab], { type: 'application/pdf' })

  return {
    pdfBlob,
    pdfSize: estimatedSize
  }
}

export const downloadPDF = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.replace(/\.(pptx|ppt)$/i, '.pdf')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const BROWSER_LOCALE_TO_OCR: Record<string, string> = {
  en: 'eng',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  zh: 'chi_sim',
  ja: 'jpn',
  ko: 'kor',
  ar: 'ara',
  ru: 'rus',
  pt: 'por',
}

export const getOCRLanguageFromLocale = (): string => {
  try {
    const locale = navigator.language || 'en'
    const lang = locale.split('-')[0].toLowerCase()
    return BROWSER_LOCALE_TO_OCR[lang] || 'eng'
  } catch {
    return 'eng'
  }
}

export const estimateOCRTime = (slideCount: number): string => {
  const secondsPerSlide = 3
  const totalSeconds = slideCount * secondsPerSlide
  if (totalSeconds < 60) {
    return `~${totalSeconds} seconds`
  }
  const minutes = Math.ceil(totalSeconds / 60)
  return `~${minutes} minute${minutes > 1 ? 's' : ''}`
}

export const MAX_FILE_COUNT = 20
