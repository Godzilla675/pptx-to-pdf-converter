import { useCallback, useState } from 'react'
import { Card } from '@/components/ui/card'
import { CloudArrowUp, FileDoc } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadZone({ onFilesSelected, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.pptx') || file.name.endsWith('.ppt')
    )
    
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles)
    }
  }, [disabled, onFilesSelected])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      onFilesSelected(Array.from(selectedFiles))
    }
    e.target.value = ''
  }, [disabled, onFilesSelected])

  return (
    <motion.div
      animate={{ scale: isDragging ? 1.02 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`relative overflow-hidden transition-all cursor-pointer ${
          isDragging
            ? 'border-accent border-2 bg-accent/5'
            : 'border-dashed border-2 border-border hover:border-accent/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="block p-12 text-center cursor-pointer">
          <input
            type="file"
            multiple
            accept=".pptx,.ppt"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
          />
          
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            {isDragging ? (
              <FileDoc size={64} weight="duotone" className="text-accent animate-bounce" />
            ) : (
              <CloudArrowUp size={64} weight="duotone" className="text-primary" />
            )}
            
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {isDragging ? 'Drop your files here' : 'Upload PowerPoint Files'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to browse • .pptx, .ppt • Max 100MB
              </p>
            </div>
            
            {!isDragging && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Batch upload supported</span>
                </div>
              </div>
            )}
          </motion.div>
        </label>
      </Card>
    </motion.div>
  )
}
