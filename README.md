# ChromaDB UI

A modern desktop application for managing ChromaDB collections and documents, built with Electron, React, and TypeScript.

[![Build & Release](https://github.com/neodisk17/chroma-ui/actions/workflows/build.yml/badge.svg)](https://github.com/neodisk17/chroma-ui/actions/workflows/build.yml)

---

## Download

Pre-built installers are published to the [Releases page](https://github.com/neodisk17/chroma-ui/releases/latest) for every version tag. Files on the Releases page are permanent and publicly downloadable — no account or store required.

| Platform | File | Architecture |
|----------|------|--------------|
| macOS | `.dmg` installer | x64, arm64 (Apple Silicon) |
| macOS | `.zip` archive (for auto-updater) | x64, arm64 (Apple Silicon) |
| Windows | NSIS `.exe` installer | x64 |
| Windows | Portable `.exe` (no install needed) | x64 |
| Linux | `.AppImage` (run anywhere) | x64 |
| Linux | `.deb` package (Debian/Ubuntu) | x64 |

**[Download the latest release →](https://github.com/neodisk17/chroma-ui/releases/latest)**

---

## Features

- **Connection management** — save and switch between multiple ChromaDB server profiles
- **Collection browser** — create, rename, and delete collections
- **Document explorer** — view, search, filter, and edit documents with metadata
- **Query builder** — run similarity and filter queries with visual results
- **Embedding configuration** — configure global and per-collection embedding models
- **Dark / light theme** — persisted theme preference with flash-free init

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 28 |
| UI framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | TailwindCSS 3 + shadcn/ui |
| Routing | React Router 6 |
| Validation | Zod |
| Embeddings | @xenova/transformers |
| Packaging | electron-builder |

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:3000`, compiles the Electron main/preload scripts, and launches the app with hot reload.

### Available scripts

```bash
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript + Vite bundle
npm run build:mac        # Package for macOS (dmg + zip)
npm run build:win        # Package for Windows (nsis + portable)
npm run build:linux      # Package for Linux (AppImage + deb)
npm run build:all        # Package for all platforms (requires native tools)
npm run typecheck        # TypeScript type check
npm run lint             # ESLint
npm run test             # Run tests (vitest)
npm run test:coverage    # Run tests with coverage report
```

### Cross-platform builds (local)

Windows and Linux installers can be built from any OS using Docker:

```bash
# Windows installer
npm run build:docker:win

# Linux packages
npm run build:docker:linux

# Both
npm run build:docker:all
```

The Docker image (`docker/Dockerfile.build`) uses [`electronuserland/builder:wine`](https://github.com/electron-userland/electron-builder-image) which includes Wine for cross-compiling Windows targets.

---

## CI/CD

The GitHub Actions pipeline (`.github/workflows/build.yml`) builds all three platforms in parallel using native runners:

| Job | Runner | Outputs |
|-----|--------|---------|
| `build-macos` | `macos-latest` | `.dmg`, `.zip` (x64 + arm64) |
| `build-windows` | `windows-latest` | NSIS `.exe`, portable `.exe` (x64) |
| `build-linux` | `ubuntu-latest` | `.AppImage`, `.deb` (x64) |

**Triggers:**
- Push a tag `v*.*.*` → builds all platforms, creates a **permanent GitHub Release** with all installers as downloadable assets
- `workflow_dispatch` → builds all platforms on demand; artifacts are available in the Actions run for 30 days (useful for testing builds before tagging a release)

No other branches trigger builds, keeping CI minutes usage minimal.

---

## Project Structure

```
chroma-ui/
├── .github/workflows/    # CI/CD pipeline
├── electron/             # Main process (Node.js)
│   ├── main.ts
│   ├── preload.ts
│   └── services/         # IPC handlers, auto-updater, embedding services
├── src/                  # Renderer process (React)
│   ├── components/       # Shared UI components
│   ├── pages/            # Route pages (Home, Collections, Documents, Query)
│   ├── hooks/            # Custom React hooks
│   └── styles/           # TailwindCSS globals and theme tokens
├── shared/               # Types and constants shared between main and renderer
├── public/               # Static assets (favicon.svg, icons)
├── build/                # Electron-builder icon assets (icns, ico, png)
├── docker/
│   └── Dockerfile.build  # Cross-platform build image (Wine)
├── docker-compose.yml    # Local cross-platform build services
├── electron-builder.yml  # Packaging configuration
└── vite.config.ts        # Vite + Electron plugin config
```

---

## Security

- **Context isolation** enabled — renderer has no direct Node.js access
- **Node integration** disabled in renderer
- **contextBridge** with typed IPC channels for all main ↔ renderer communication
- **Zod validation** on all IPC messages
- **Content Security Policy** configured in `index.html`

---

## License

MIT
