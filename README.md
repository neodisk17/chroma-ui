# ChromaDB Desktop UI

A modern desktop application for managing ChromaDB collections and documents, built with Electron, React, and TypeScript.

## Phase 1: Project Setup & Core Infrastructure ✅

**Status**: Complete
**Completed**: 2026-01-07

### What's Implemented

Phase 1 has been successfully completed with the following features:

#### 1. **Project Structure**
- ✅ Electron + React + TypeScript setup with Vite
- ✅ Clean separation: `electron/` (main process), `src/` (renderer), `shared/` (types)
- ✅ TypeScript strict mode enabled for maximum type safety
- ✅ Absolute imports configured (`@/` for src, `@shared/` for shared)

#### 2. **Styling & UI**
- ✅ TailwindCSS with PostCSS configured
- ✅ Shadcn/ui design system foundation
- ✅ Dark mode support (CSS variables ready)
- ✅ Responsive layout with sidebar and header

#### 3. **Code Quality**
- ✅ ESLint with TypeScript and React rules
- ✅ Prettier configured for consistent formatting
- ✅ No TypeScript errors or ESLint warnings

#### 4. **Security & IPC**
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Type-safe IPC communication with Zod validation
- ✅ Preload script with contextBridge
- ✅ Content Security Policy configured

#### 5. **Core Features**
- ✅ Main window with proper lifecycle management
- ✅ React Router v6 for navigation
- ✅ Basic layout: Sidebar + Header + Content area
- ✅ IPC ping/pong test implemented and working
- ✅ Hot module reload functional

## Project Structure

```
chroma-ui/
├── electron/                 # Main process (Node.js)
│   ├── main.ts              # Electron main entry, window management
│   └── preload.ts           # Context bridge for secure IPC
├── src/                     # Renderer process (React)
│   ├── components/
│   │   └── layout/          # Layout components
│   │       ├── MainLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── pages/               # Route pages
│   │   ├── HomePage.tsx     # Includes IPC test
│   │   ├── CollectionsPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   └── QueryPage.tsx
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn)
│   ├── styles/
│   │   └── globals.css      # TailwindCSS + theme variables
│   ├── types/
│   │   └── electron.d.ts    # TypeScript declarations
│   ├── App.tsx              # React Router setup
│   └── main.tsx             # React entry point
├── shared/                  # Shared between main and renderer
│   ├── constants.ts         # IPC channels, app constants
│   ├── types.ts             # TypeScript interfaces
│   └── schemas.ts           # Zod validation schemas
├── index.html               # HTML entry point
├── vite.config.ts           # Vite + Electron plugin config
├── tsconfig.json            # TypeScript config (renderer)
├── tsconfig.node.json       # TypeScript config (main)
├── tailwind.config.js       # TailwindCSS configuration
├── postcss.config.js        # PostCSS configuration
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- macOS, Windows, or Linux

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

This will:
1. Start the Vite dev server on http://localhost:3000
2. Build and watch Electron main and preload scripts
3. Launch the Electron app with DevTools open
4. Enable hot module reload for React components

### Available Scripts

```bash
npm run dev         # Start development mode
npm run build       # Build for production
npm run typecheck   # Run TypeScript type checking
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

## Testing Phase 1

The app should now be running. You can verify Phase 1 completion by:

### ✅ Verification Checklist

1. **App Launches**: Electron window opens successfully
2. **Layout Renders**: Sidebar, header, and main content area visible
3. **Navigation Works**: Click sidebar items to navigate between pages
4. **IPC Communication**:
   - Go to Home page
   - Click "Send Ping" button
   - Should receive "Pong! Received: Hello from renderer!" response
5. **Hot Reload**:
   - Edit any React component (e.g., change text in HomePage.tsx)
   - App should automatically reload with changes
6. **TypeScript**: Run `npm run typecheck` - should pass with no errors
7. **Linting**: Run `npm run lint` - should pass with no warnings
8. **Developer Tools**: DevTools should be open in development mode

### Expected Behavior

- **Window Size**: 1280x800 (minimum 1024x768)
- **Sidebar**: Shows Home, Collections, and Query navigation items
- **Header**: Shows current page title and "Not Connected" status
- **Home Page**: Shows welcome message and IPC test button
- **Security**: Context isolation enabled, Node.js integration disabled

## Security Features

Phase 1 implements Electron security best practices:

- ✅ **Context Isolation**: Enabled to prevent renderer access to Node.js
- ✅ **Node Integration**: Disabled in renderer process
- ✅ **Preload Script**: Uses contextBridge for safe IPC communication
- ✅ **Content Security Policy**: Basic CSP configured in index.html
- ✅ **IPC Validation**: Zod schemas validate all IPC messages
- ✅ **Navigation Protection**: Prevents navigation to external URLs
- ✅ **Window Control**: Prevents opening new windows

## Next Steps: Phase 2

Phase 2 will implement Connection Management:
- ChromaDB connection profiles
- Secure credential storage (OS keychain)
- Connection testing and switching
- Connection pool management

See `TODO.md` for detailed Phase 2 requirements.

## Technology Stack

- **Electron**: ^28.1.0 - Desktop app framework
- **React**: ^18.2.0 - UI library
- **TypeScript**: ^5.3.3 - Type safety
- **Vite**: ^5.0.10 - Build tool
- **TailwindCSS**: ^3.4.0 - Styling
- **React Router**: ^6.21.1 - Client-side routing
- **Zod**: ^3.22.4 - Runtime validation
- **vite-plugin-electron**: ^0.28.2 - Electron integration

## Contributing

This project follows strict TypeScript and ESLint rules:
- TypeScript strict mode enabled
- No `any` types allowed
- All React hooks rules enforced
- Prettier for consistent formatting

Run `npm run lint` and `npm run typecheck` before committing.

## License

MIT

---

**Phase 1 Complete!** 🎉

The foundation is now ready. All core infrastructure is in place, and the app is ready for Phase 2 development.
