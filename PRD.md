# Planning Guide

A web-based PowerPoint to PDF converter that transforms PPTX files into high-quality PDFs directly in the browser with real-time preview and comprehensive conversion controls.

**Experience Qualities**:
1. **Professional** - Clean, business-oriented interface that feels reliable and trustworthy for important document conversion
2. **Efficient** - Fast, responsive operations with clear progress indicators and batch processing capabilities
3. **Intuitive** - Drag-and-drop simplicity with smart defaults that require minimal configuration

**Complexity Level**: Light Application (multiple features with basic state)
- This is a focused conversion tool with file handling, preview capabilities, conversion settings, and batch operations. It maintains state for uploaded files, conversion options, and history, but doesn't require complex multi-view navigation or advanced data management systems.

## Essential Features

**File Upload**
- Functionality: Accept PPTX files via drag-and-drop or file picker, support multiple files simultaneously
- Purpose: Provide flexible input methods that match user workflow preferences
- Trigger: User drags files to drop zone or clicks upload button
- Progression: Drop files → Validate format → Display file cards with thumbnails → Ready for conversion
- Success criteria: Files validate correctly, show file size/name, display meaningful error for invalid formats

**Conversion Preview**
- Functionality: Display slide thumbnails before conversion, show slide count and file metadata
- Purpose: Verify correct file uploaded and preview content before conversion
- Trigger: File successfully uploaded
- Progression: File uploaded → Extract slide count → Generate preview thumbnails → Display in grid
- Success criteria: Thumbnails load within 2 seconds, display first 3-5 slides clearly

**PDF Conversion**
- Functionality: Convert PPTX to PDF with quality settings, maintain formatting and images
- Purpose: Core conversion functionality with control over output quality
- Trigger: User clicks "Convert to PDF" button
- Progression: Click convert → Show progress bar → Process file → Generate PDF → Auto-download
- Success criteria: PDF downloads automatically, maintains slide formatting, file size reasonable for quality setting

**Conversion Settings**
- Functionality: Configure quality (standard/high), page orientation, compression level
- Purpose: Give users control over output characteristics based on their needs
- Trigger: User opens settings panel before conversion
- Progression: Open settings → Adjust sliders/toggles → Settings persist → Apply during conversion
- Success criteria: Settings affect output quality/size as expected, persist between sessions

**Batch Processing**
- Functionality: Queue multiple files, convert all at once or individually, track progress per file
- Purpose: Efficiency for users converting multiple presentations
- Trigger: Upload multiple files, click "Convert All"
- Progression: Upload files → Queue formation → Sequential conversion → Individual download or ZIP
- Success criteria: All files convert successfully, progress tracked individually, no file loss

**Conversion History**
- Functionality: Track recent conversions with timestamps, allow re-download of recent PDFs
- Purpose: Quick access to recently converted files without re-uploading
- Trigger: Successful conversion completion
- Progression: Conversion completes → Save to history → Display in sidebar → Allow re-download
- Success criteria: History persists across sessions, files accessible for re-download, limit to 10 most recent

**OCR (Optical Character Recognition)**
- Functionality: Extract text from scanned slides to make PDFs searchable, support multiple languages
- Purpose: Enable text search and selection in PDFs generated from image-based or scanned slides
- Trigger: User enables OCR in settings before conversion
- Progression: Enable OCR setting → Select language → Convert file → OCR processes each slide → Embed text layer in PDF → PDF becomes searchable
- Success criteria: Text accurately extracted from slides, PDF search functionality works, supports 10+ languages including English, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Russian, and Portuguese

## Edge Case Handling

- **Invalid File Format**: Display clear error message, highlight accepted formats (.pptx), reject with toast notification
- **Oversized Files**: Show warning for files >50MB, suggest compression, allow proceed with warning
- **Corrupted Files**: Catch conversion errors, display specific error message, don't crash application
- **Browser Compatibility**: Detect unsupported browsers, show compatibility message with alternatives
- **Conversion Failure**: Retry mechanism with exponential backoff, clear error reporting, maintain queue integrity
- **Network Issues**: Handle timeout gracefully, allow offline operation for core features, cache converted files
- **OCR Failures**: Gracefully degrade if OCR fails, allow conversion to proceed without OCR, display warning message
- **Language Detection**: Auto-suggest language based on browser locale, allow manual override
- **Large Slide Decks**: Show realistic OCR processing time estimates for presentations with many slides

## Design Direction

The design should evoke professionalism, efficiency, and reliability - like a premium desktop application running in the browser. It should feel fast and modern with subtle sophisticated touches that signal quality and attention to detail.

## Color Selection

A professional workspace aesthetic with confident blues and warm accents that balance corporate trustworthiness with approachable usability.

- **Primary Color**: Deep Professional Blue `oklch(0.45 0.15 250)` - Communicates trust, stability, and technical competence
- **Secondary Colors**: Soft Slate `oklch(0.65 0.02 250)` for secondary actions and backgrounds - Creates hierarchy without competing for attention
- **Accent Color**: Vibrant Cyan `oklch(0.70 0.14 210)` for conversion buttons and success states - Energetic and forward-moving
- **Foreground/Background Pairings**:
  - Background (Soft White `oklch(0.98 0 0)`): Foreground Text (`oklch(0.25 0.01 250)`) - Ratio 12.8:1 ✓
  - Primary Blue (`oklch(0.45 0.15 250)`): White text (`oklch(0.99 0 0)`) - Ratio 7.2:1 ✓
  - Accent Cyan (`oklch(0.70 0.14 210)`): Dark text (`oklch(0.25 0.01 250)`) - Ratio 8.5:1 ✓
  - Card Background (`oklch(1 0 0)`): Foreground text (`oklch(0.25 0.01 250)`) - Ratio 14.1:1 ✓

## Font Selection

Typography should convey technical precision while remaining highly readable for interface elements and file metadata.

- **Primary Font**: Space Grotesk - Modern geometric sans with technical character, perfect for UI and headings
- **Secondary Font**: JetBrains Mono - Monospace for file names, sizes, and metadata that benefits from fixed-width alignment

- **Typographic Hierarchy**:
  - H1 (App Title): Space Grotesk Bold/32px/tight letter spacing/-0.02em
  - H2 (Section Headers): Space Grotesk SemiBold/24px/normal/0em
  - H3 (Card Titles): Space Grotesk Medium/18px/normal/0em
  - Body (UI Text): Space Grotesk Regular/16px/relaxed/1.5 line height
  - Metadata (File Info): JetBrains Mono Regular/14px/normal/1.4 line height
  - Small (Labels): Space Grotesk Medium/13px/wide/0.01em uppercase

## Animations

Animations should emphasize the transformation from PowerPoint to PDF while maintaining a professional, purposeful feel. Upload interactions should feel tactile and responsive, while conversion progress should communicate active processing. File cards should gracefully enter and exit with smooth spring physics. Progress indicators should pulse subtly to show activity without distraction.

## Component Selection

- **Components**:
  - Card: File upload zone, individual file cards, settings panel
  - Button: Primary conversion action (accent color), secondary actions (ghost variant)
  - Progress: Linear progress bars for conversion status with custom gradient
  - Slider: Quality settings with custom thumb styling
  - Select: Output format options, page orientation
  - Switch: Toggle options like compression, include notes
  - Tabs: Switch between single/batch conversion modes
  - Dialog: Detailed settings, conversion history modal
  - Badge: File status indicators (ready, converting, complete, error)
  - Separator: Divide sections clearly
  - ScrollArea: File queue and history lists
  
- **Customizations**:
  - Drag-drop zone with dashed border animation on drag-over
  - File preview thumbnails with custom aspect ratio containers
  - Custom progress bar with animated gradient fill
  - Toast notifications with download links (using sonner)
  
- **States**:
  - Upload zone: Default (dashed border), Drag-over (solid border + background highlight + scale), Active (pulsing border)
  - Convert button: Default (gradient accent), Hover (lift + glow), Active (converting, spinning icon), Disabled (muted), Success (green checkmark pulse)
  - File cards: Idle (white background), Selected (blue border), Converting (animated progress overlay), Complete (success badge), Error (red outline + error icon)
  - Settings controls: Sliders show real-time value changes, switches have satisfying toggle animation
  
- **Icon Selection**:
  - Upload: CloudArrowUp (main upload action)
  - File type: FilePdf, FileDoc for format indicators
  - Conversion: ArrowsDownUp, ArrowRight for transformation
  - Settings: Gear, SlidersHorizontal for configuration
  - Actions: Download, Trash, X for file operations
  - Status: CheckCircle, XCircle, Clock, Warning for states
  - Preview: Eye for preview modal
  
- **Spacing**:
  - Container padding: p-8 (32px) for main areas
  - Card padding: p-6 (24px) internally
  - Component gaps: gap-6 (24px) between major sections, gap-4 (16px) between related elements
  - Button spacing: px-6 py-3 for primary actions, px-4 py-2 for secondary
  - Grid gaps: gap-4 for file grids
  
- **Mobile**:
  - Single column layout below 768px
  - Upload zone reduces from 400px to full width minus 32px padding
  - File cards stack vertically with full width
  - Settings move from sidebar to bottom sheet drawer
  - Conversion history accessible via floating button instead of persistent sidebar
  - Touch-optimized file selection with larger tap targets (min 44px)
  - Simplified batch mode with sequential single-file view
