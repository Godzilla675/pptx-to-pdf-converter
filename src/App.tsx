import { useState, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { ConversionFile, ConversionSettings } from '@/lib/types'
import { 
  validateFile, 
  generateThumbnail, 
  estimateSlideCount, 
  convertToPDF, 
  downloadPDF,
  generateId,
  getOCRLanguageFromLocale,
  estimateOCRTime,
  MAX_FILE_COUNT
} from '@/lib/converter'
import { UploadZone } from '@/components/UploadZone'
import { FileCard } from '@/components/FileCard'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ArrowsDownUp, Clock, FilePdf } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'

function App() {
  const [files, setFiles] = useState<ConversionFile[]>([])
  const detectedOCRLanguage = getOCRLanguageFromLocale()
  const [settings = {
    quality: 'high' as const,
    maintainAspectRatio: true,
    includeNotes: false,
    compression: 85,
    enableOCR: false,
    ocrLanguage: detectedOCRLanguage
  }, setSettings] = useKV<ConversionSettings>('conversion-settings', {
    quality: 'high',
    maintainAspectRatio: true,
    includeNotes: false,
    compression: 85,
    enableOCR: false,
    ocrLanguage: detectedOCRLanguage
  })

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    // File count limit check
    const availableSlots = MAX_FILE_COUNT - files.length
    if (availableSlots <= 0) {
      toast.error('File queue is full', {
        description: `Maximum ${MAX_FILE_COUNT} files allowed. Remove some files before adding more.`
      })
      return
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots)
    if (filesToProcess.length < selectedFiles.length) {
      toast.warning(`Only ${filesToProcess.length} of ${selectedFiles.length} files added`, {
        description: `Queue limit is ${MAX_FILE_COUNT} files.`
      })
    }

    const newFiles: ConversionFile[] = []

    for (const file of filesToProcess) {
      const validation = validateFile(file)
      
      if (!validation.valid) {
        toast.error(`Invalid file: ${file.name}`, {
          description: validation.error
        })
        continue
      }

      if (validation.warning) {
        toast.warning(`${file.name}`, {
          description: validation.warning
        })
      }

      // Duplicate file detection
      const isDuplicate = files.some(
        existing => existing.name === file.name && existing.size === file.size
      ) || newFiles.some(
        existing => existing.name === file.name && existing.size === file.size
      )
      if (isDuplicate) {
        toast.warning(`Duplicate file skipped: ${file.name}`, {
          description: 'A file with the same name and size is already in the queue.'
        })
        continue
      }

      const id = generateId()
      const thumbnailUrl = await generateThumbnail(file)
      const slideCount = await estimateSlideCount(file)

      newFiles.push({
        id,
        file,
        name: file.name,
        size: file.size,
        status: 'ready',
        progress: 0,
        thumbnailUrl,
        slideCount
      })
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      toast.success(`${newFiles.length} file(s) added`, {
        description: 'Ready to convert'
      })
    }
  }, [files])

  const handleConvert = useCallback(async (fileId: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId)
    if (fileIndex === -1) return

    const file = files[fileIndex]
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'converting', progress: 0 } : f
    ))

    toast.info(`Converting ${file.name}...`, {
      description: settings.enableOCR 
        ? `Processing with OCR (${estimateOCRTime(file.slideCount || 0)}) - this may take longer` 
        : 'This may take a few moments'
    })

    try {
      const { pdfBlob, pdfSize } = await convertToPDF(
        file,
        settings,
        (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ))
        }
      )

      const pdfUrl = URL.createObjectURL(pdfBlob)

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'complete', progress: 100, pdfUrl } : f
      ))

      toast.success(`${file.name} converted!`, {
        description: settings.enableOCR ? 'PDF is now searchable with OCR text layer' : 'Click Download to save your PDF',
        action: {
          label: 'Download',
          onClick: () => downloadPDF(pdfBlob, file.name)
        }
      })
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: 'Conversion failed. Please try again.' 
        } : f
      ))

      toast.error('Conversion failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }, [files, settings])

  const handleConvertAll = useCallback(async () => {
    const readyFiles = files.filter(f => f.status === 'ready')
    
    if (readyFiles.length === 0) {
      toast.warning('No files ready to convert')
      return
    }

    toast.info(`Converting ${readyFiles.length} file(s)...`)
    
    for (const file of readyFiles) {
      await handleConvert(file.id)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [files, handleConvert])

  const handleDownload = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file || !file.pdfUrl) return

    fetch(file.pdfUrl)
      .then(res => res.blob())
      .then(blob => {
        downloadPDF(blob, file.name)
        toast.success('PDF downloaded!')
      })
      .catch(() => {
        toast.error('Download failed')
      })
  }, [files])

  const handleRemove = useCallback((fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.status === 'converting') return prev
      if (file?.pdfUrl) {
        URL.revokeObjectURL(file.pdfUrl)
      }
      if (file?.thumbnailUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(file.thumbnailUrl)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }, [])

  const readyCount = files.filter(f => f.status === 'ready').length
  const convertingCount = files.filter(f => f.status === 'converting').length
  const completeCount = files.filter(f => f.status === 'complete').length

  // Warn user before navigating away during active conversion
  useEffect(() => {
    if (convertingCount === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [convertingCount])

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.pdfUrl) URL.revokeObjectURL(file.pdfUrl)
        if (file.thumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(file.thumbnailUrl)
      })
    }
  }, [])

  const handleFilesRejected = useCallback((count: number) => {
    toast.error(`${count} file(s) rejected`, {
      description: 'Only .pptx and .ppt files are supported.'
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0.45 0.15 250 / 0.03) 2px, oklch(0.45 0.15 250 / 0.03) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, oklch(0.45 0.15 250 / 0.03) 2px, oklch(0.45 0.15 250 / 0.03) 4px)
          `
        }}
      />

      <div className="relative">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ArrowsDownUp size={32} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  PowerPoint to PDF Converter
                </h1>
                <p className="text-muted-foreground">
                  Convert your presentations to high-quality PDFs instantly
                </p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <UploadZone 
                onFilesSelected={handleFilesSelected}
                onFilesRejected={handleFilesRejected}
                disabled={convertingCount > 0}
              />

              {files.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">File Queue</h2>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {readyCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock weight="fill" size={14} />
                            {readyCount} ready
                          </span>
                        )}
                        {convertingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock weight="fill" size={14} className="animate-spin" />
                            {convertingCount} converting
                          </span>
                        )}
                        {completeCount > 0 && (
                          <span className="flex items-center gap-1">
                            <FilePdf weight="fill" size={14} />
                            {completeCount} complete
                          </span>
                        )}
                      </div>
                    </div>
                    {readyCount > 1 && (
                      <Button
                        onClick={handleConvertAll}
                        disabled={convertingCount > 0}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        Convert All ({readyCount})
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {files.map(file => (
                          <FileCard
                            key={file.id}
                            file={file}
                            onRemove={handleRemove}
                            onDownload={handleDownload}
                            onConvert={handleConvert}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </Card>
              )}


            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <SettingsPanel 
                  settings={settings}
                  onSettingsChange={setSettings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App