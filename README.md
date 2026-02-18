# PowerPoint to PDF Converter

A web-based PowerPoint to PDF converter that transforms PPTX/PPT files into high-quality PDFs directly in the browser with real-time preview and comprehensive conversion controls.

## Features

- **Drag-and-Drop Upload** — Add PPTX/PPT files via drag-and-drop or a file picker, with support for multiple files at once
- **Slide Preview** — View auto-generated slide thumbnails and file metadata before converting
- **PDF Conversion** — Convert presentations to PDF with configurable quality settings (standard, high, maximum)
- **Batch Processing** — Queue and convert multiple files sequentially with per-file progress tracking
- **OCR Support** — Extract text from slides using [Tesseract.js](https://github.com/naptha/tesseract.js) to produce searchable PDFs, with support for 10+ languages
- **Conversion Settings** — Adjust quality, compression level, aspect ratio, and speaker notes inclusion; settings persist between sessions
- **Instant Download** — Download converted PDFs directly from the browser with one click

## Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite](https://vite.dev/) 7 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) 4 |
| **UI Components** | [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **OCR** | [Tesseract.js](https://github.com/naptha/tesseract.js) 7 |
| **Icons** | [Phosphor Icons](https://phosphoricons.com/), [Lucide](https://lucide.dev/), [Heroicons](https://heroicons.com/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.dev/) |
| **Platform** | [GitHub Spark](https://githubnext.com/projects/github-spark/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (included with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Godzilla675/powerpoint-to-pdf-co.git
cd powerpoint-to-pdf-co

# Install dependencies
npm install
```

### Development

```bash
# Start the local development server (port 5000)
npm run dev
```

### Build

```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
powerpoint-to-pdf-co/
├── src/
│   ├── components/          # React UI components
│   │   ├── ui/              # Reusable shadcn/ui primitives
│   │   ├── FileCard.tsx     # Individual file card with status and actions
│   │   ├── SettingsPanel.tsx # Conversion settings sidebar
│   │   └── UploadZone.tsx   # Drag-and-drop file upload area
│   ├── lib/
│   │   ├── converter.ts     # Core conversion logic and file utilities
│   │   ├── ocr.ts           # OCR processing with Tesseract.js
│   │   ├── types.ts         # Shared TypeScript type definitions
│   │   └── utils.ts         # General utility functions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── PRD.md                   # Product Requirements Document
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Usage

1. **Upload** — Drag and drop `.pptx` or `.ppt` files onto the upload zone, or click to browse (max 100 MB per file)
2. **Configure** — Adjust conversion settings in the right-hand panel:
   - **Quality** — Standard, High, or Maximum
   - **Compression** — Slider from 0–100
   - **OCR** — Toggle on and select a language to make PDFs searchable
   - **Options** — Maintain aspect ratio, include speaker notes
3. **Convert** — Click **Convert** on a single file or **Convert All** for batch processing
4. **Download** — Once conversion completes, click **Download** or use the toast notification link

## Configuration

Conversion settings are persisted in the GitHub Spark KV store. Default values:

| Setting | Default |
|---|---|
| Quality | High |
| Compression | 85 |
| Maintain Aspect Ratio | On |
| Include Notes | Off |
| OCR | Off |
| OCR Language | English |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
