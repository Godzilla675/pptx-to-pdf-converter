import { createWorker, OEM } from 'tesseract.js'

export interface OCRProgress {
  status: string
  progress: number
}

export interface OCRResult {
  text: string
  confidence: number
}

let worker: Awaited<ReturnType<typeof createWorker>> | null = null

export const initializeOCRWorker = async (language: string = 'eng'): Promise<void> => {
  if (worker) {
    await worker.terminate()
  }

  worker = await createWorker(language, OEM.LSTM_ONLY, {
    logger: (m: { status: string; progress: number }) => {
      // logging handled per-call via onProgress
    }
  })
}

export const performOCR = async (
  imageData: HTMLCanvasElement | HTMLImageElement | string,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> => {
  if (!worker) {
    throw new Error('OCR worker not initialized. Call initializeOCRWorker first.')
  }

  const result = await worker.recognize(imageData)

  if (onProgress) {
    onProgress({ status: 'completed', progress: 100 })
  }

  return {
    text: result.data.text,
    confidence: result.data.confidence
  }
}

export const terminateOCRWorker = async (): Promise<void> => {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

export const extractTextFromSlides = async (
  slides: (HTMLCanvasElement | string)[],
  language: string,
  onProgress?: (slideIndex: number, total: number, ocrProgress: OCRProgress) => void
): Promise<string[]> => {
  await initializeOCRWorker(language)

  const textResults: string[] = []

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    
    const result = await performOCR(slide, (progress) => {
      if (onProgress) {
        onProgress(i, slides.length, progress)
      }
    })

    textResults.push(result.text)
  }

  await terminateOCRWorker()
  
  return textResults
}
