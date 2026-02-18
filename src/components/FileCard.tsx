import { ConversionFile } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, Trash, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import { formatFileSize } from '@/lib/converter'
import { motion } from 'framer-motion'

interface FileCardProps {
  file: ConversionFile
  onRemove: (id: string) => void
  onDownload: (id: string) => void
  onConvert: (id: string) => void
}

export function FileCard({ file, onRemove, onDownload, onConvert }: FileCardProps) {
  const getStatusBadge = () => {
    switch (file.status) {
      case 'ready':
        return (
          <Badge variant="secondary" className="gap-1.5">
            <Clock weight="fill" size={14} />
            Ready
          </Badge>
        )
      case 'converting':
        return (
          <Badge className="gap-1.5 bg-accent text-accent-foreground">
            <Clock weight="fill" size={14} className="animate-spin" />
            Converting
          </Badge>
        )
      case 'complete':
        return (
          <Badge variant="default" className="gap-1.5 bg-green-600 hover:bg-green-700">
            <CheckCircle weight="fill" size={14} />
            Complete
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1.5">
            <XCircle weight="fill" size={14} />
            Error
          </Badge>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
    >
      <Card className={`overflow-hidden transition-all ${
        file.status === 'error' ? 'border-destructive' : 
        file.status === 'complete' ? 'border-green-500' : ''
      }`}>
        <div className="flex gap-4 p-4">
          {file.thumbnailUrl && (
            <div className="flex-shrink-0">
              <img 
                src={file.thumbnailUrl} 
                alt={file.name}
                className="w-32 h-24 object-cover rounded-md border border-border"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate mb-1">{file.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>{formatFileSize(file.size)}</span>
                  {file.slideCount && <span>{file.slideCount} slides</span>}
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge()}
              </div>
            </div>

            {file.status === 'converting' && (
              <div className="space-y-1.5 mb-3">
                <Progress value={file.progress} className="h-2" />
                <p className="text-xs text-muted-foreground font-mono">{file.progress}%</p>
              </div>
            )}

            {file.status === 'error' && file.error && (
              <p className="text-xs text-destructive mb-3">{file.error}</p>
            )}

            <div className="flex gap-2">
              {file.status === 'ready' && (
                <Button
                  size="sm"
                  onClick={() => onConvert(file.id)}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Convert to PDF
                </Button>
              )}
              
              {file.status === 'complete' && file.pdfUrl && (
                <Button
                  size="sm"
                  onClick={() => onDownload(file.id)}
                  className="gap-1.5"
                >
                  <Download weight="bold" size={16} />
                  Download PDF
                </Button>
              )}
              
              {file.status === 'error' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onConvert(file.id)}
                >
                  Retry
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(file.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash weight="bold" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
