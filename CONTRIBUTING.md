# Contributing

Thank you for your interest in contributing to the PowerPoint to PDF Converter! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/<your-username>/powerpoint-to-pdf-co.git
   cd powerpoint-to-pdf-co
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server on port 5000 |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint across the project |
| `npm run preview` | Preview the production build locally |

## Project Overview

The source code lives in the `src/` directory:

- **`src/components/`** — React components including the upload zone, file cards, and settings panel. Reusable primitives from shadcn/ui are in `src/components/ui/`.
- **`src/lib/`** — Core logic for file validation, conversion, OCR, and shared TypeScript types.
- **`src/App.tsx`** — Root application component that wires together state, settings, and child components.

## Making Changes

1. Create a new branch from `main`:

   ```bash
   git checkout -b my-feature
   ```

2. Make your changes, keeping commits focused and descriptive.

3. Run the linter before committing:

   ```bash
   npm run lint
   ```

4. Ensure the project builds successfully:

   ```bash
   npm run build
   ```

5. Push your branch and open a Pull Request against `main`.

## Coding Guidelines

- Write TypeScript for all source files; avoid `any` types where possible.
- Follow the existing code style enforced by ESLint.
- Use path aliases (`@/`) for imports from the `src/` directory.
- Keep components small and focused. Shared UI primitives belong in `src/components/ui/`.

## Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/Godzilla675/powerpoint-to-pdf-co/issues) with a clear description and steps to reproduce.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
