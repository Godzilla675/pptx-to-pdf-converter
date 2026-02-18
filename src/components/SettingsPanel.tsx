import { ConversionSettings, ConversionQuality } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Gear, TextAa } from '@phosphor-icons/react'

interface SettingsPanelProps {
  settings: ConversionSettings
  onSettingsChange: (settings: ConversionSettings) => void
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const updateSettings = (partial: Partial<ConversionSettings>) => {
    onSettingsChange({ ...settings, ...partial })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Gear weight="duotone" size={24} className="text-primary" />
        <h2 className="text-lg font-semibold">Conversion Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="quality" className="text-sm font-medium">
            Output Quality
          </Label>
          <Select
            value={settings.quality}
            onValueChange={(value: ConversionQuality) => updateSettings({ quality: value })}
          >
            <SelectTrigger id="quality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard (Balanced)</SelectItem>
              <SelectItem value="high">High (Larger file)</SelectItem>
              <SelectItem value="maximum">Maximum (Best quality)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Higher quality produces larger file sizes
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="compression" className="text-sm font-medium">
              Compression Level
            </Label>
            <span className="text-sm font-mono text-muted-foreground">
              {settings.compression}%
            </span>
          </div>
          <Slider
            id="compression"
            min={50}
            max={100}
            step={5}
            value={[settings.compression]}
            onValueChange={(value) => updateSettings({ compression: value[0] })}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower compression reduces file size but may affect quality
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="aspect-ratio" className="text-sm font-medium">
                Maintain Aspect Ratio
              </Label>
              <p className="text-xs text-muted-foreground">
                Preserve original slide dimensions
              </p>
            </div>
            <Switch
              id="aspect-ratio"
              checked={settings.maintainAspectRatio}
              onCheckedChange={(checked) => updateSettings({ maintainAspectRatio: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-notes" className="text-sm font-medium">
                Include Speaker Notes
              </Label>
              <p className="text-xs text-muted-foreground">
                Add notes pages to PDF output
              </p>
            </div>
            <Switch
              id="include-notes"
              checked={settings.includeNotes}
              onCheckedChange={(checked) => updateSettings({ includeNotes: checked })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TextAa weight="duotone" size={20} className="text-primary" />
            <h3 className="text-sm font-semibold">OCR Settings</h3>
            <Badge variant="secondary" className="text-xs">New</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-ocr" className="text-sm font-medium">
                Enable OCR
              </Label>
              <p className="text-xs text-muted-foreground">
                Make scanned slides text-searchable
              </p>
            </div>
            <Switch
              id="enable-ocr"
              checked={settings.enableOCR}
              onCheckedChange={(checked) => updateSettings({ enableOCR: checked })}
            />
          </div>

          {settings.enableOCR && (
            <div className="space-y-3 pl-1 border-l-2 border-accent/30">
              <div className="pl-3">
                <Label htmlFor="ocr-language" className="text-sm font-medium">
                  OCR Language
                </Label>
                <Select
                  value={settings.ocrLanguage}
                  onValueChange={(value: string) => updateSettings({ ocrLanguage: value })}
                >
                  <SelectTrigger id="ocr-language" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="fra">French</SelectItem>
                    <SelectItem value="deu">German</SelectItem>
                    <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
                    <SelectItem value="jpn">Japanese</SelectItem>
                    <SelectItem value="kor">Korean</SelectItem>
                    <SelectItem value="ara">Arabic</SelectItem>
                    <SelectItem value="rus">Russian</SelectItem>
                    <SelectItem value="por">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Select the primary language in your slides
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
