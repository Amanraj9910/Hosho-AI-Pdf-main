# Hosho AI PDF (React + Vite + TypeScript)

A modern React + TypeScript single-page app scaffolded with Vite and styled with Tailwind CSS and shadcn/ui (Radix). It includes a responsive layout, a floating navbar, a chat interface, and a document intelligence view, suitable as a starting point for PDF/document‑centric UIs.

## Features

- **Vite + React + TypeScript**: Fast dev server, HMR, and typed DX
- **Tailwind CSS + shadcn/ui + Radix**: Accessible, composable UI primitives
- **Routing**: `react-router-dom` with example pages (`Index`, `NotFound`)
- **State & forms**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **UI components**: Floating navbar, Chat interface, JSON viewer, and more
- **Charts & UX**: Optional `recharts`, `sonner` toasts, `react-query` for fetching
- **Build output**: Static site in `dist/` ready for any static hosting

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 5
- **Styling**: Tailwind CSS, tailwind-merge, tailwindcss-animate
- **UI**: shadcn/ui components with Radix primitives
- **Routing**: react-router-dom
- **Data**: @tanstack/react-query (optional usage)

## Project Structure

```
root
├─ public/                 # Static assets
│  ├─ uploads/             # Example uploaded assets
│  └─ web.config           # IIS/static hosting config (optional)
├─ src/
│  ├─ components/          # Reusable UI components
│  │  ├─ ChatInterface.tsx
│  │  ├─ DocumentIntelligence.tsx
│  │  ├─ FloatingNavbar.tsx
│  │  └─ JSONPreview.tsx
│  ├─ hooks/               # Custom hooks
│  │  ├─ use-mobile.tsx
│  │  └─ use-toast.ts
│  ├─ lib/                 # Utilities
│  │  └─ utils.ts
│  ├─ pages/               # App pages & routing targets
│  │  ├─ Index.tsx
│  │  └─ NotFound.tsx
│  ├─ App.tsx              # App shell
│  ├─ main.tsx             # App entry
│  └─ index.css/App.css    # Global styles
├─ index.html              # Vite HTML entry
├─ tailwind.config.ts      # Tailwind config
├─ postcss.config.js       # PostCSS config
├─ vite.config.ts          # Vite configuration
├─ package.json            # Scripts and dependencies
└─ dist/                   # Production build output
```

## Prerequisites

- Node.js 18+ (recommended LTS)
- A package manager: npm (default), pnpm, or bun

Note: A `bun.lockb` file exists, but standard npm scripts are defined. Use one tool consistently per machine.

## Getting Started

1. Install dependencies
   - npm:
     ```bash
     npm install
     ```
   - pnpm:
     ```bash
     pnpm install
     ```
   - bun:
     ```bash
     bun install
     ```

2. Start the dev server
   - npm:
     ```bash
     npm run dev
     ```
   - pnpm:
     ```bash
     pnpm dev
     ```
   - bun:
     ```bash
     bun run dev
     ```

3. Open the app
   - Vite will print a local URL (typically `http://localhost:5173`).

## Scripts

- **dev**: Start Vite dev server
  ```bash
  npm run dev
  ```
- **build**: Production build to `dist/`
  ```bash
  npm run build
  ```
- **build:dev**: Dev-mode build (useful for non-minified artifacts)
  ```bash
  npm run build:dev
  ```
- **preview**: Preview the production build locally
  ```bash
  npm run preview
  ```
- **lint**: Run ESLint
  ```bash
  npm run lint
  ```

## Environment & Configuration

- This template does not require environment variables by default.
- Add any required runtime configuration (e.g., API URLs) via `.env` and consume with Vite’s `import.meta.env` if needed.
- Tailwind configuration is in `tailwind.config.ts`. Extend or enable plugins as required.

## Development Notes

- **UI components**: The project uses shadcn/ui patterns. Add new components under `src/components` and prefer composition over custom styling where possible.
- **Routing**: Pages are under `src/pages` and wired from `App.tsx`. Add new routes there.
- **Static assets**: Place under `public/`. Anything in `public/` is copied to `dist/` as-is.

## Build & Deploy

1. Build
   ```bash
   npm run build
   ```
   Outputs to `dist/`.

2. Deploy static files
   - Any static host works: GitHub Pages, Netlify, Vercel (static), Cloudflare Pages, S3 + CloudFront, Azure Static Web Apps, or IIS.
   - The repo includes `.nojekyll` and `web.config` (IIS) to assist certain hosts.

3. Preview locally (optional)
   ```bash
   npm run preview
   ```

## Troubleshooting

- If styles don’t load:
  - Verify Tailwind is working: check `index.css` imports and `tailwind.config.ts` content paths.
- If routes 404 on a static host:
  - Configure SPA fallback to `index.html` (e.g., Netlify `_redirects`, Vercel rewrites, IIS `web.config`).
- If dependencies conflict:
  - Stick to a single package manager (npm, pnpm, or bun). Remove the other lockfiles.

## License

Add your license of choice here (e.g., MIT).