import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
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

interface SlideData {
  texts: { content: string; x: number; y: number; fontSize: number; bold: boolean }[]
  images: { dataUrl: string; x: number; y: number; w: number; h: number }[]
}

interface SlideSize {
  widthInches: number
  heightInches: number
}

const parseEmu = (emu: string | undefined): number => {
  if (!emu) return 0
  return parseInt(emu, 10) / 914400 // EMU to inches
}

const parsePptxSlides = async (file: File): Promise<{ slides: SlideData[]; slideCount: number; slideSize: SlideSize }> => {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Read slide dimensions from presentation.xml
  let slideSize: SlideSize = { widthInches: 13.333, heightInches: 7.5 } // Default widescreen 16:9
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('text')
  if (presentationXml) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(presentationXml, 'text/xml')
    const sldSz = doc.getElementsByTagName('p:sldSz')[0]
    if (sldSz) {
      const cx = sldSz.getAttribute('cx')
      const cy = sldSz.getAttribute('cy')
      if (cx) slideSize.widthInches = parseInt(cx, 10) / 914400
      if (cy) slideSize.heightInches = parseInt(cy, 10) / 914400
    }
  }

  // Find all slide files
  const slideFiles: string[] = []
  zip.forEach((path) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/)
    if (match) {
      slideFiles.push(path)
    }
  })

  // Sort by slide number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0', 10)
    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0', 10)
    return numA - numB
  })

  // Load media images
  const mediaImages: Record<string, string> = {}

  // Parse relationships for each slide to map rId to media files
  const loadSlideRels = async (slideIndex: number): Promise<Record<string, string>> => {
    const relsPath = `ppt/slides/_rels/slide${slideIndex}.xml.rels`
    const relsFile = zip.file(relsPath)
    const rels: Record<string, string> = {}
    if (relsFile) {
      const relsXml = await relsFile.async('text')
      const parser = new DOMParser()
      const doc = parser.parseFromString(relsXml, 'text/xml')
      const relationships = doc.getElementsByTagName('Relationship')
      for (let i = 0; i < relationships.length; i++) {
        const rel = relationships[i]
        const rId = rel.getAttribute('Id') || ''
        const target = rel.getAttribute('Target') || ''
        const type = rel.getAttribute('Type') || ''
        if (type.includes('image')) {
          // Resolve relative path from ppt/slides/ to ppt/
          const mediaPath = target.startsWith('../') ? 'ppt/' + target.slice(3) : target
          rels[rId] = mediaPath
        }
      }
    }
    return rels
  }

  // Pre-load all media files
  const mediaFolder = zip.folder('ppt/media')
  if (mediaFolder) {
    const mediaPromises: Promise<void>[] = []
    mediaFolder.forEach((relativePath, entry) => {
      const fullPath = 'ppt/media/' + relativePath
      const promise = entry.async('base64').then((base64) => {
        let mimeType = 'image/png'
        if (relativePath.endsWith('.jpg') || relativePath.endsWith('.jpeg')) mimeType = 'image/jpeg'
        else if (relativePath.endsWith('.gif')) mimeType = 'image/gif'
        else if (relativePath.endsWith('.emf')) mimeType = 'image/emf'
        else if (relativePath.endsWith('.wmf')) mimeType = 'image/wmf'
        mediaImages[fullPath] = `data:${mimeType};base64,${base64}`
      })
      mediaPromises.push(promise)
    })
    await Promise.all(mediaPromises)
  }

  const slides: SlideData[] = []

  for (const slidePath of slideFiles) {
    const slideNum = parseInt(slidePath.match(/slide(\d+)/)?.[1] || '0', 10)
    const slideXml = await zip.file(slidePath)?.async('text')
    if (!slideXml) continue

    const parser = new DOMParser()
    const doc = parser.parseFromString(slideXml, 'text/xml')

    const slideData: SlideData = { texts: [], images: [] }

    // Extract text from all text bodies
    const spElements = doc.getElementsByTagName('p:sp')
    for (let i = 0; i < spElements.length; i++) {
      const sp = spElements[i]
      
      // Get position from spPr/xfrm
      const xfrm = sp.getElementsByTagName('a:xfrm')[0]
      const off = xfrm?.getElementsByTagName('a:off')[0]
      const ext = xfrm?.getElementsByTagName('a:ext')[0]
      const x = parseEmu(off?.getAttribute('x') || undefined)
      const y = parseEmu(off?.getAttribute('y') || undefined)

      // Extract text runs
      const paragraphs = sp.getElementsByTagName('a:p')
      let slideY = y
      for (let p = 0; p < paragraphs.length; p++) {
        const runs = paragraphs[p].getElementsByTagName('a:r')
        let paragraphText = ''
        let isBold = false
        let fontSize = 18

        for (let r = 0; r < runs.length; r++) {
          const textEl = runs[r].getElementsByTagName('a:t')[0]
          if (textEl?.textContent) {
            paragraphText += textEl.textContent
          }
          // Check for bold
          const rPr = runs[r].getElementsByTagName('a:rPr')[0]
          if (rPr?.getAttribute('b') === '1') isBold = true
          const szAttr = rPr?.getAttribute('sz')
          if (szAttr) fontSize = parseInt(szAttr, 10) / 100
        }

        if (paragraphText.trim()) {
          slideData.texts.push({
            content: paragraphText,
            x,
            y: slideY,
            fontSize: Math.max(10, Math.min(fontSize, 72)),
            bold: isBold
          })
          slideY += fontSize / 72 * 1.4 // line spacing
        }
      }
    }

    // Extract images from pic elements
    const rels = await loadSlideRels(slideNum)
    const picElements = doc.getElementsByTagName('p:pic')
    for (let i = 0; i < picElements.length; i++) {
      const pic = picElements[i]
      
      // Get blipFill embed reference
      const blip = pic.getElementsByTagName('a:blip')[0]
      const embedId = blip?.getAttribute('r:embed')
      
      if (embedId && rels[embedId]) {
        const mediaPath = rels[embedId]
        const dataUrl = mediaImages[mediaPath]
        
        if (dataUrl && !mediaPath.endsWith('.emf') && !mediaPath.endsWith('.wmf')) {
          const xfrm = pic.getElementsByTagName('a:xfrm')[0]
          const off = xfrm?.getElementsByTagName('a:off')[0]
          const ext = xfrm?.getElementsByTagName('a:ext')[0]
          
          slideData.images.push({
            dataUrl,
            x: parseEmu(off?.getAttribute('x') || undefined),
            y: parseEmu(off?.getAttribute('y') || undefined),
            w: parseEmu(ext?.getAttribute('cx') || undefined),
            h: parseEmu(ext?.getAttribute('cy') || undefined)
          })
        }
      }
    }

    slides.push(slideData)
  }

  return { slides, slideCount: slideFiles.length, slideSize }
}

export const estimateSlideCount = async (file: File): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    let count = 0
    zip.forEach((path) => {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
        count++
      }
    })
    return count || 1
  } catch {
    return 1
  }
}

const renderSlideToCanvas = (
  slideData: SlideData,
  slideIndex: number,
  totalSlides: number,
  fileName: string,
  quality: ConversionSettings['quality'],
  slideSize: SlideSize
): HTMLCanvasElement => {
  const scale = quality === 'maximum' ? 2 : quality === 'high' ? 1.5 : 1
  const baseH = 540
  const baseW = Math.round(baseH * (slideSize.widthInches / slideSize.heightInches))
  const canvas = document.createElement('canvas')
  canvas.width = baseW * scale
  canvas.height = baseH * scale
  const ctx = canvas.getContext('2d')!

  ctx.scale(scale, scale)

  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, baseW, baseH)

  const pptWidth = slideSize.widthInches
  const pptHeight = slideSize.heightInches
  const scaleX = baseW / pptWidth
  const scaleY = baseH / pptHeight

  // Render text
  for (const text of slideData.texts) {
    const px = text.x * scaleX
    const py = text.y * scaleY
    const fontPx = Math.round(text.fontSize * (scaleY / 10))
    const clampedFont = Math.max(8, Math.min(fontPx, 60))

    ctx.fillStyle = '#1a1a1a'
    ctx.font = `${text.bold ? 'bold ' : ''}${clampedFont}px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // Word wrap within slide bounds
    const maxWidth = baseW - px - 20
    const words = text.content.split(' ')
    let line = ''
    let lineY = py

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, Math.max(10, px), lineY)
        line = word
        lineY += clampedFont * 1.3
      } else {
        line = testLine
      }
    }
    if (line) {
      ctx.fillText(line, Math.max(10, px), lineY)
    }
  }

  // If no text was found, show a fallback indicator
  if (slideData.texts.length === 0 && slideData.images.length === 0) {
    ctx.fillStyle = '#999'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Slide ${slideIndex + 1}`, baseW / 2, baseH / 2 - 10)
    ctx.font = '12px sans-serif'
    ctx.fillText(fileName, baseW / 2, baseH / 2 + 15)
  }

  return canvas
}

export const convertToPDF = async (
  file: ConversionFile,
  settings: ConversionSettings,
  onProgress: (progress: number) => void
): Promise<{ pdfBlob: Blob; pdfSize: number }> => {
  onProgress(5)

  // Parse the PPTX file
  let parsedSlides: SlideData[]
  let slideSize: SlideSize
  try {
    const result = await parsePptxSlides(file.file)
    parsedSlides = result.slides
    slideSize = result.slideSize
  } catch (error) {
    throw new Error('Failed to parse PowerPoint file. Make sure it is a valid .pptx file.')
  }

  if (parsedSlides.length === 0) {
    throw new Error('No slides found in the PowerPoint file.')
  }

  onProgress(20)

  // Determine PDF page dimensions
  const pdfSize: SlideSize = settings.maintainAspectRatio
    ? slideSize
    : { widthInches: 11.693, heightInches: 8.268 } // A4 landscape

  // Render slides to canvases
  const canvases: HTMLCanvasElement[] = []
  for (let i = 0; i < parsedSlides.length; i++) {
    const canvas = renderSlideToCanvas(
      parsedSlides[i],
      i,
      parsedSlides.length,
      file.name,
      settings.quality,
      settings.maintainAspectRatio ? slideSize : pdfSize
    )
    canvases.push(canvas)
    onProgress(20 + Math.floor((i / parsedSlides.length) * 20))
  }

  onProgress(40)

  // Load images onto canvases (async because we need to load image elements)
  for (let i = 0; i < parsedSlides.length; i++) {
    const slideData = parsedSlides[i]
    const canvas = canvases[i]
    const ctx = canvas.getContext('2d')!
    const scale = settings.quality === 'maximum' ? 2 : settings.quality === 'high' ? 1.5 : 1
    const renderSize = settings.maintainAspectRatio ? slideSize : pdfSize
    const baseH = 540
    const baseW = Math.round(baseH * (renderSize.widthInches / renderSize.heightInches))
    const pptWidth = renderSize.widthInches
    const pptHeight = renderSize.heightInches
    const scaleX = baseW / pptWidth
    const scaleY = baseH / pptHeight

    for (const img of slideData.images) {
      try {
        const image = new Image()
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => resolve() // Skip broken images
          image.src = img.dataUrl
        })
        const px = img.x * scaleX * scale
        const py = img.y * scaleY * scale
        const pw = (img.w || 3) * scaleX * scale
        const ph = (img.h || 2) * scaleY * scale
        ctx.drawImage(image, px, py, pw, ph)
      } catch {
        // Skip images that fail to load
      }
    }
    onProgress(40 + Math.floor((i / parsedSlides.length) * 10))
  }

  onProgress(50)

  // OCR processing if enabled
  if (settings.enableOCR) {
    try {
      await extractTextFromSlides(
        canvases,
        settings.ocrLanguage,
        (slideIndex, total, ocrProgress) => {
          const baseProgress = 50
          const ocrProgressRange = 30
          const slideProgress = (slideIndex / total) * ocrProgressRange
          const withinSlideProgress = (ocrProgress.progress / 100) * (ocrProgressRange / total)
          onProgress(Math.floor(baseProgress + slideProgress + withinSlideProgress))
        }
      )
      onProgress(80)
    } catch (error) {
      console.error('OCR processing error:', error)
      throw new Error('OCR processing failed during conversion. You can retry with OCR disabled.')
    }
  }

  const pdfProgress = settings.enableOCR ? 80 : 50

  // Generate PDF using jsPDF
  const jpegQuality = settings.compression / 100
  const pdfWidth = pdfSize.widthInches
  const pdfHeight = pdfSize.heightInches
  const isLandscape = pdfWidth > pdfHeight

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'in',
    format: isLandscape ? [pdfWidth, pdfHeight] : [pdfHeight, pdfWidth]
  })

  for (let i = 0; i < canvases.length; i++) {
    if (i > 0) {
      pdf.addPage(isLandscape ? [pdfWidth, pdfHeight] : [pdfHeight, pdfWidth], isLandscape ? 'landscape' : 'portrait')
    }

    const imgData = canvases[i].toDataURL('image/jpeg', jpegQuality)
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)

    onProgress(pdfProgress + Math.floor((i / canvases.length) * 15))
  }

  onProgress(95)

  const pdfBlob = pdf.output('blob')

  onProgress(100)

  return {
    pdfBlob,
    pdfSize: pdfBlob.size
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
