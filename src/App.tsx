import { useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { ConversionFile, ConversionSettings, ConversionHistory } from '@/lib/types'
import { 
  validateFile, 
  generateThumbnail, 
  estimateSlideCount, 
  convertToPDF, 
  downloadPDF,
  generateId,
  formatFileSize
} from '@/lib/converter'
import { UploadZone } from '@/components/UploadZone'
import { FileCard } from '@/components/FileCard'
import { SettingsPanel } from '@/components/SettingsPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowsDownUp, Clock, FilePdf } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

function App() {
  const [files, setFiles] = useState<ConversionFile[]>([])
  const [settings = {
    quality: 'high' as const,
    maintainAspectRatio: true,
    includeNotes: false,
    compression: 85
  }, setSettings] = useKV<ConversionSettings>('conversion-settings', {
    quality: 'high',
    maintainAspectRatio: true,
    includeNotes: false,
    compression: 85
  })
  const [history = [], setHistory] = useKV<ConversionHistory[]>('conversion-history', [])

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const newFiles: ConversionFile[] = []

    for (const file of selectedFiles) {
      const validation = validateFile(file)
      
      if (!validation.valid) {
        toast.error(`Invalid file: ${file.name}`, {
          description: validation.error
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
  }, [])

  const handleConvert = useCallback(async (fileId: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId)
    if (fileIndex === -1) return

    const file = files[fileIndex]
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'converting', progress: 0 } : f
    ))

    toast.info(`Converting ${file.name}...`, {
      description: 'This may take a few moments'
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

      const historyEntry: ConversionHistory = {
        id: generateId(),
        fileName: file.name,
        convertedAt: Date.now(),
        pdfUrl,
        originalSize: file.size,
        pdfSize
      }

      setHistory(prev => [historyEntry, ...(prev || [])].slice(0, 10))

      toast.success(`${file.name} converted!`, {
        description: 'Click Download to save your PDF',
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
  }, [files, settings, setHistory])

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
      if (file?.pdfUrl) {
        URL.revokeObjectURL(file.pdfUrl)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }, [])

  const readyCount = files.filter(f => f.status === 'ready').length
  const convertingCount = files.filter(f => f.status === 'converting').length
  const completeCount = files.filter(f => f.status === 'complete').length

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

              {history.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Conversions</h2>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.fileName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {format(item.convertedAt, 'MMM d, h:mm a')} • {formatFileSize(item.pdfSize)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            fetch(item.pdfUrl)
                              .then(res => res.blob())
                              .then(blob => downloadPDF(blob, item.fileName))
                              .catch(() => toast.error('File no longer available'))
                          }}
                        >
                          <FilePdf weight="fill" size={16} />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
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