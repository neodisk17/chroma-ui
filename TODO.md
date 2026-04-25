# ChromaDB Desktop UI - TODO & Implementation Guide

## Project Status Overview

**Current Phase**: Phase 9 - Testing
**Last Updated**: 2026-01-08
**Overall Progress**: 8/10 Phases Complete

---

## Phase Completion Tracker

- [x] **Phase 1**: Project Setup & Core Infrastructure
- [x] **Phase 2**: Connection Management
- [x] **Phase 3**: Collection Management
- [x] **Phase 4**: Document Viewing & Grid
- [x] **Phase 5**: Query Builder
- [x] **Phase 6**: Document CRUD Operations
- [x] **Phase 7**: Embeddings Visualization
- [x] **Phase 8**: Polish & Error Handling
- [ ] **Phase 9**: Testing
- [ ] **Phase 10**: Production Build & Distribution

---

## 📋 Phase 1: Project Setup & Core Infrastructure

**Status**: ✅ Completed (2026-01-07)
**Goal**: Working Electron + React + TypeScript app with IPC communication

### Tasks Checklist

- [x] 1.1 Initialize project with Electron Vite + React + TypeScript
- [x] 1.2 Set up project directory structure (electron/, src/, shared/)
- [x] 1.3 Configure TypeScript (tsconfig.json for main and renderer)
- [x] 1.4 Set up TailwindCSS + PostCSS
- [x] 1.5 Install and configure Shadcn/ui
- [x] 1.6 Configure ESLint + Prettier
- [x] 1.7 Create basic IPC pattern with Zod validation
- [x] 1.8 Implement electron/main.ts with window creation
- [x] 1.9 Create basic MainLayout component with sidebar
- [x] 1.10 Set up React Router for navigation

### Production-Grade Prompt for Phase 1

```
I'm starting Phase 1 of building a ChromaDB desktop application using Electron + React + TypeScript. Please help me set up the foundational infrastructure following these requirements:

REQUIREMENTS:
1. Initialize an Electron + React + TypeScript project using Electron Vite
2. Create a clean project structure:
   - electron/ (main process)
   - src/ (renderer process - React)
   - shared/ (shared types and schemas)
3. Set up TypeScript with strict mode enabled for both main and renderer processes
4. Configure TailwindCSS with PostCSS for styling
5. Install and configure Shadcn/ui component library
6. Set up ESLint + Prettier with recommended rules for React and TypeScript
7. Implement a type-safe IPC communication pattern:
   - Use Zod for runtime validation of IPC messages
   - Create preload script with context bridge
   - Ensure context isolation is enabled
8. Create electron/main.ts with:
   - Proper window lifecycle management
   - Development/production environment handling
   - Security best practices (disable nodeIntegration, enable contextIsolation)
9. Build a basic MainLayout component with:
   - Sidebar navigation
   - Header with title
   - Main content area
   - Responsive design
10. Set up React Router v6 for client-side routing

BEST PRACTICES TO FOLLOW:
- Enable TypeScript strict mode for maximum type safety
- Use absolute imports with path aliases (@/ for src/)
- Implement proper error boundaries
- Set up hot module reload for fast development
- Configure Vite for optimal build performance
- Use ESLint rules: recommended + react-hooks + typescript-eslint
- Follow Electron security best practices: https://www.electronjs.org/docs/latest/tutorial/security
- Ensure IPC communication is type-safe using TypeScript and Zod
- Use Content Security Policy (CSP) in production
- Separate concerns: main process vs renderer process

EXPECTED DELIVERABLES:
1. Working Electron app that launches successfully
2. React app renders with basic layout (sidebar + header + content)
3. Type-safe IPC communication working (test with a simple ping/pong)
4. Hot reload functional for both main and renderer
5. All TypeScript code compiles without errors
6. ESLint passes with no warnings

VERIFICATION STEPS:
- Run `npm run dev` and verify app launches
- Check that hot reload works when editing React components
- Verify TypeScript compilation succeeds
- Test IPC by sending a test message from renderer to main
- Confirm no console errors in both main process and devtools
```

### Critical Files to Create in Phase 1

```
/Users/lokeshkumar/Documents/project/AI/chroma-ui/
├── package.json
├── tsconfig.json (renderer)
├── tsconfig.node.json (main process)
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc
├── electron/
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   └── layout/
│   │       ├── MainLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
└── shared/
    ├── constants.ts
    ├── types.ts
    └── schemas.ts (Zod schemas)
```

### Common Pitfalls to Avoid
- ❌ Not enabling context isolation in Electron (security risk)
- ❌ Using require() instead of ES modules
- ❌ Not validating IPC messages (leads to runtime errors)
- ❌ Mixing main process and renderer process code
- ❌ Not setting up absolute imports (messy relative paths)
- ❌ Skipping TypeScript strict mode (loses type safety)

---

## 📋 Phase 2: Connection Management

**Status**: ✅ Completed (2026-01-08)
**Goal**: Users can create, test, and connect to ChromaDB instances securely

### Tasks Checklist

- [x] 2.1 Install dependencies: chromadb, electron-store, keytar
- [x] 2.2 Create electron/services/credential-store.ts (keytar wrapper)
- [x] 2.3 Create electron/services/connection-manager.ts (ChromaDB client pool)
- [x] 2.4 Implement electron/ipc/connection-handler.ts with IPC handlers
- [x] 2.5 Create shared/schemas.ts with ConnectionProfile schema
- [x] 2.6 Create src/stores/connection-store.ts (Zustand store)
- [x] 2.7 Build ConnectionDialog.tsx component
- [x] 2.8 Build ConnectionList.tsx component
- [x] 2.9 Build ConnectionStatus.tsx component
- [x] 2.10 Implement connection testing and switching logic

### Production-Grade Prompt for Phase 2

```
I'm implementing Phase 2: Connection Management for the ChromaDB desktop app. Please help me build a secure connection management system with the following requirements:

REQUIREMENTS:
1. Install required dependencies:
   - chromadb (full client package)
   - electron-store (for connection profile storage)
   - keytar (for secure credential storage in OS keychain)

2. Create electron/services/credential-store.ts:
   - Wrap keytar for saving/retrieving credentials
   - Service: "chromadb-ui" for all credentials
   - Store credentials by connection ID
   - Methods: saveCredential(), getCredential(), deleteCredential()
   - Handle errors gracefully (keychain access denied, etc.)

3. Create electron/services/connection-manager.ts:
   - Manage ChromaDB client instances (connection pool)
   - Lazy connection: only connect when needed
   - Methods: connect(), disconnect(), getClient(), testConnection()
   - Auto-reconnect with exponential backoff (max 3 retries)
   - Health check: periodic heartbeat to detect disconnections
   - Proper cleanup on app quit

4. Create electron/ipc/connection-handler.ts:
   - IPC handlers for: connection:list, connection:create, connection:update, connection:delete, connection:test, connection:connect
   - Validate all inputs using Zod schemas
   - Return typed results with error handling
   - Never send credentials to renderer process

5. Create shared/schemas.ts:
   - ConnectionProfileSchema: id, name, host, port, authType, useSSL, createdAt, updatedAt
   - Credentials stored separately in OS keychain (not in profile)
   - Use Zod for runtime validation

6. Create src/stores/connection-store.ts (Zustand):
   - State: connections (list), activeConnection, isConnecting, error
   - Actions: loadConnections(), setActiveConnection(), addConnection(), updateConnection(), deleteConnection()
   - Persist active connection ID to localStorage

7. Build UI components:
   - ConnectionDialog: Form with validation (name, host, port, auth type, token input)
   - ConnectionList: Sidebar list, click to switch, right-click menu (edit/delete)
   - ConnectionStatus: Header indicator showing active connection and status

8. Implement connection testing flow:
   - Before saving a new connection, test it using connection:test IPC
   - Show loading spinner during test
   - Display success/error message
   - Only allow saving if test succeeds or user explicitly bypasses

9. Connection switching:
   - Click connection in sidebar to switch
   - Disconnect previous connection gracefully
   - Show loading state during switch
   - Update UI to reflect active connection

SECURITY BEST PRACTICES:
- ✅ Store credentials ONLY in OS keychain (never in JSON files or localStorage)
- ✅ All ChromaDB operations happen in main process (renderer never has credentials)
- ✅ Validate all IPC messages with Zod
- ✅ Use HTTPS for remote connections (warn user if using HTTP)
- ✅ Sanitize connection profile data before storing
- ✅ Handle keychain access errors gracefully (user might deny access)

BEST PRACTICES:
- Implement proper connection lifecycle (connect → use → disconnect → cleanup)
- Use TypeScript interfaces for all ChromaDB client operations
- Add proper TypeScript types for all IPC handlers (type-safe IPC)
- Handle connection timeouts (5 seconds for test, 10 seconds for connect)
- Display user-friendly error messages (e.g., "Connection refused" → "Cannot connect to ChromaDB at localhost:8000. Is the server running?")
- Implement optimistic updates for connection list UI
- Add keyboard shortcuts: Cmd/Ctrl+Shift+C for new connection

EXPECTED DELIVERABLES:
1. Create/edit/delete connection profiles through UI
2. Credentials stored securely in OS keychain (verify with Keychain Access on macOS)
3. Test connection before saving (ping ChromaDB server)
4. Switch between connections seamlessly
5. Connection status visible in header
6. Error handling for all failure scenarios (network error, auth error, etc.)

VERIFICATION STEPS:
- Create a connection to local ChromaDB (localhost:8000)
- Verify credentials are NOT in any JSON files (only in OS keychain)
- Test connection and verify success/error messages
- Switch between multiple connections
- Restart app and verify active connection is restored
- Test with invalid credentials and verify error handling
- Check that connection pool properly cleans up on disconnect
```

### Common Pitfalls to Avoid
- ❌ Storing credentials in electron-store (insecure)
- ❌ Sending credentials to renderer process via IPC
- ❌ Not handling keychain access denied errors
- ❌ Creating new ChromaDB clients on every request (connection leak)
- ❌ Not implementing connection timeout (hangs forever)
- ❌ Not validating connection profile data

---

## 📋 Phase 3: Collection Management

**Status**: ✅ Completed (2026-01-08)
**Goal**: View, create, update, delete ChromaDB collections with full metadata

### Tasks Checklist

- [ ] 3.1 Install TanStack Query: @tanstack/react-query
- [ ] 3.2 Create electron/ipc/chromadb-handler.ts with collection operations
- [ ] 3.3 Set up TanStack Query provider in src/App.tsx
- [ ] 3.4 Create src/hooks/use-chromadb.ts with React Query hooks
- [ ] 3.5 Build CollectionList.tsx component
- [ ] 3.6 Build CollectionDetail.tsx component
- [ ] 3.7 Build CollectionDialog.tsx component (create/edit)
- [ ] 3.8 Implement collection CRUD operations
- [ ] 3.9 Add collection search/filter functionality
- [ ] 3.10 Implement optimistic updates and error handling

### Production-Grade Prompt for Phase 3

```
I'm implementing Phase 3: Collection Management for the ChromaDB desktop app. Please help me build a comprehensive collection management system with the following requirements:

REQUIREMENTS:
1. Install TanStack Query (React Query v5):
   - Configure QueryClient with sensible defaults
   - Set up QueryClientProvider in App.tsx
   - Enable devtools in development mode

2. Create electron/ipc/chromadb-handler.ts:
   - Implement IPC handlers for collection operations:
     * collection:list - Get all collections
     * collection:get - Get collection by name (with metadata)
     * collection:create - Create new collection
     * collection:update - Update collection metadata
     * collection:delete - Delete collection
   - Use active connection from connection manager
   - Validate inputs with Zod schemas
   - Return consistent error format: { success: boolean, data?: any, error?: string }

3. Create src/hooks/use-chromadb.ts:
   - React Query hooks for collections:
     * useCollections() - Query all collections with auto-refetch
     * useCollection(name) - Query single collection
     * useCreateCollection() - Mutation for creating
     * useUpdateCollection() - Mutation for updating
     * useDeleteCollection() - Mutation for deleting
   - Configure appropriate cache times (5 minutes for collections)
   - Implement optimistic updates for mutations
   - Handle error states gracefully

4. Build src/components/collections/CollectionList.tsx:
   - Sidebar component listing all collections
   - Display collection name and document count
   - Search/filter input at top
   - Loading skeleton while fetching
   - Empty state: "No collections yet. Create your first collection!"
   - Click to select, highlight active collection
   - Right-click context menu: Edit, Delete, Duplicate
   - Refresh button to manually refetch

5. Build src/components/collections/CollectionDetail.tsx:
   - Display comprehensive collection metadata:
     * Name
     * Number of documents
     * Embedding dimension
     * Distance function (L2, cosine, IP)
     * Metadata schema
     * Created/modified timestamps
   - Action buttons: Add Document, Query, Edit Collection, Delete Collection
   - Stats visualization (optional: chart showing document count over time)

6. Build src/components/collections/CollectionDialog.tsx:
   - Form for creating/editing collections:
     * Collection name (required, alphanumeric + underscore)
     * Embedding function (dropdown: default, OpenAI, etc.)
     * Distance function (dropdown: L2, cosine, IP)
     * Metadata (optional, JSON editor)
   - Form validation with Zod
   - Real-time validation feedback
   - Submit button disabled until valid
   - Cancel and Save buttons

7. Implement collection CRUD:
   - Create: Validate name uniqueness, show success toast
   - Update: Only allow metadata changes (name is immutable in ChromaDB)
   - Delete: Confirmation dialog with warning about data loss
   - Optimistic updates: Update UI immediately, rollback on error

8. Add search/filter:
   - Filter collections by name (case-insensitive)
   - Debounce search input (300ms)
   - Show "No results" when filter returns empty

9. Error handling:
   - Network errors: "Cannot connect to ChromaDB. Check your connection."
   - Duplicate name: "Collection with this name already exists."
   - Permission errors: "You don't have permission to perform this action."
   - Generic errors: Display ChromaDB error message

10. Implement notifications:
    - Success: "Collection 'my-collection' created successfully"
    - Error: "Failed to create collection: [reason]"
    - Use toast notifications (sonner or similar)

BEST PRACTICES:
- ✅ Use TanStack Query for all server state (automatic caching, background refetching)
- ✅ Implement optimistic updates for better UX
- ✅ Show loading skeletons instead of spinners
- ✅ Handle stale data with proper cache invalidation
- ✅ Use React.memo for expensive components
- ✅ Debounce search input to reduce IPC calls
- ✅ Validate collection names (alphanumeric + underscore only)
- ✅ Show confirmation dialogs for destructive actions
- ✅ Display helpful empty states
- ✅ Use keyboard shortcuts: Cmd/Ctrl+N for new collection

EXPECTED DELIVERABLES:
1. View all collections in sidebar with search
2. Click collection to view details
3. Create new collection with form validation
4. Update collection metadata
5. Delete collection with confirmation
6. Real-time updates when operations complete
7. Error handling for all edge cases
8. Loading states and empty states

VERIFICATION STEPS:
- Create a new collection and verify it appears in list
- Search for collection and verify filtering works
- View collection details and verify all metadata is displayed
- Update collection metadata and verify changes persist
- Delete collection and verify confirmation dialog shows
- Test with no collections (empty state)
- Test error scenarios: duplicate name, invalid input, disconnected
- Verify optimistic updates work (UI updates immediately)
```

### Common Pitfalls to Avoid
- ❌ Not invalidating query cache after mutations
- ❌ Forgetting optimistic updates (UI feels slow)
- ❌ Not handling edge cases (empty states, errors)
- ❌ Allowing duplicate collection names
- ❌ Not debouncing search input (too many IPC calls)
- ❌ Showing generic error messages (not helpful to users)

---

## 📋 Phase 4: Document Viewing & Grid

**Status**: ✅ Completed (2026-01-08)
**Goal**: View documents in high-performance grid with 10,000+ row support

### Tasks Checklist

- [x] 4.1 Install AG Grid: ag-grid-react, ag-grid-community
- [x] 4.2 Extend chromadb-handler.ts with document operations
- [x] 4.3 Create useDocuments() and useDocument() hooks
- [x] 4.4 Build DocumentGrid.tsx with AG Grid
- [x] 4.5 Build DocumentDetail.tsx component
- [x] 4.6 Build EmbeddingViewer.tsx component
- [x] 4.7 Implement column configuration
- [x] 4.8 Add document selection (single/bulk)
- [x] 4.9 Implement grid export (JSON/CSV)
- [x] 4.10 Add loading states and error handling

### Production-Grade Prompt for Phase 4

```
I'm implementing Phase 4: Document Viewing & Grid for the ChromaDB desktop app. Please help me build a high-performance document grid using AG Grid with the following requirements:

REQUIREMENTS:
1. Install AG Grid Community:
   - ag-grid-react (React wrapper)
   - ag-grid-community (core library)

2. Extend electron/ipc/chromadb-handler.ts:
   - Add document:query handler:
     * Parameters: collectionName, limit, offset
     * Support pagination (fetch 100 documents at a time)
     * Return: { ids, documents, metadatas, embeddings }
   - Add document:get handler:
     * Parameters: collectionName, documentId
     * Return full document with all fields

3. Create React Query hooks in use-chromadb.ts:
   - useDocuments(collectionName, { limit, offset }):
     * Paginated query with keepPreviousData
     * Auto-refetch on window focus
     * Cache time: 2 minutes
   - useDocument(collectionName, documentId):
     * Single document query
     * Cache time: 5 minutes

4. Build src/components/documents/DocumentGrid.tsx:
   - AG Grid configuration:
     * Virtual scrolling enabled (rowModelType: 'infinite' or 'clientSide')
     * Columns: ID (120px), Document (preview, 400px), Metadata (preview, 300px), Actions (100px)
     * Row height: 48px
     * Enable row selection (checkbox column)
     * Column resize, sort, filter enabled
   - Pagination controls:
     * Previous/Next buttons
     * Page number display
     * Jump to page input
     * Items per page: 100, 500, 1000
   - Custom cell renderers:
     * Document column: Show first 100 chars + "..."
     * Metadata column: Show JSON preview with formatted display
     * Actions column: View, Edit, Delete buttons
   - Performance optimizations:
     * Use React.memo for grid component
     * Memoize column definitions
     * Debounce filter/sort operations
   - Loading overlay when fetching data
   - Empty state: "No documents in this collection. Add your first document!"

5. Build src/components/documents/DocumentDetail.tsx:
   - Side panel or modal showing full document
   - Sections:
     * Document ID (copyable)
     * Full document text (scrollable, monospace font)
     * Metadata (JSON viewer with syntax highlighting)
     * Embedding (expandable section with EmbeddingViewer)
   - Action buttons: Edit, Delete, Close
   - Copy to clipboard buttons for each section

6. Build src/components/documents/EmbeddingViewer.tsx:
   - Display embedding vector:
     * Show dimension count (e.g., "384 dimensions")
     * Collapsed by default (show first 5 values + "...")
     * Expand/collapse button
     * When expanded: Show all values in grid format (10 per row)
     * Format numbers to 6 decimal places
   - Optional: Show vector magnitude and normalized values
   - Copy vector as JSON button

7. Column configuration:
   - Allow users to resize columns (persist to localStorage)
   - Column menu: Sort ascending/descending, filter
   - Default sort: by ID (ascending)

8. Document selection:
   - Checkbox column for row selection
   - Select all checkbox in header
   - Show selection count: "3 documents selected"
   - Bulk actions toolbar when selection > 0:
     * Delete selected button
     * Export selected button
     * Clear selection button

9. Grid export:
   - Export to JSON: Full documents with all fields
   - Export to CSV: ID, document text, metadata (flattened)
   - Use browser download API
   - Filename format: collection-name-YYYY-MM-DD.json/csv

10. Loading states and errors:
    - Skeleton loader while initial fetch
    - Loading overlay during pagination
    - Error state: "Failed to load documents. [Retry button]"
    - Empty state with helpful message and "Add Document" button

BEST PRACTICES:
- ✅ Enable virtual scrolling for performance with large datasets
- ✅ Use infinite scroll or pagination (don't load 10,000 rows at once)
- ✅ Memoize expensive computations (column defs, cell renderers)
- ✅ Debounce search and filter operations
- ✅ Show loading states for better UX
- ✅ Implement keyboard navigation (arrow keys, Enter to view)
- ✅ Make document text searchable (Cmd/Ctrl+F)
- ✅ Persist grid state (column widths, sort order) to localStorage
- ✅ Handle edge cases: empty collection, very long documents, missing fields
- ✅ Add tooltips for truncated text (show full text on hover)

PERFORMANCE CONSIDERATIONS:
- Limit initial fetch to 100 documents
- Use AG Grid's infinite scroll for large datasets
- Don't render embeddings in grid (only in detail view)
- Implement pagination server-side if dataset > 10,000 documents
- Use React.memo for DocumentDetail component
- Debounce grid filter/sort operations (300ms)

EXPECTED DELIVERABLES:
1. High-performance grid displaying documents
2. Pagination working smoothly (100 documents per page)
3. View full document details in side panel
4. See embeddings in expandable viewer
5. Export documents to JSON/CSV
6. Column customization (resize, sort, filter)
7. Bulk selection and operations
8. Professional loading states and error handling

VERIFICATION STEPS:
- Load collection with 1,000+ documents and verify performance
- Test pagination (navigate through pages)
- View document details and verify all fields display correctly
- Expand embedding viewer and verify vector display
- Export documents to JSON and CSV, verify file contents
- Test bulk selection and delete
- Resize columns and verify state persists after reload
- Test with empty collection (verify empty state)
- Test error scenarios: network failure, invalid collection
```

### Common Pitfalls to Avoid
- ❌ Loading all documents at once (memory issues with large datasets)
- ❌ Not enabling virtual scrolling (poor performance)
- ❌ Rendering embeddings in grid cells (performance hit)
- ❌ Not memoizing column definitions (unnecessary re-renders)
- ❌ Not handling edge cases (empty documents, null metadata)
- ❌ Not providing loading states (feels unresponsive)

---

## 📋 Phase 5: Query Builder

**Status**: ✅ Completed (2026-01-08)
**Goal**: Build and execute complex ChromaDB queries visually without code

### Tasks Checklist

- [x] 5.1 Create src/stores/query-store.ts (Zustand)
- [x] 5.2 Design query builder UI with tabs
- [x] 5.3 Build QueryBuilder.tsx (tab container)
- [x] 5.4 Build SimilaritySearch.tsx component
- [x] 5.5 Build FilterBuilder.tsx component
- [x] 5.6 Build document filter UI
- [x] 5.7 Build QueryResults.tsx component
- [x] 5.8 Implement query execution via IPC
- [x] 5.9 Add query validation with Zod
- [x] 5.10 Implement query export and templates

### Production-Grade Prompt for Phase 5

```
I'm implementing Phase 5: Query Builder for the ChromaDB desktop app. Please help me build a visual query builder that allows users to construct complex ChromaDB queries without writing code:

REQUIREMENTS:
1. Create src/stores/query-store.ts (Zustand):
   - State:
     * queryType: 'similarity' | 'filter' | 'combined'
     * queryText: string (for similarity search)
     * nResults: number (default: 10)
     * metadataFilters: FilterCondition[] (array of conditions)
     * documentFilters: FilterCondition[]
     * results: QueryResult[] | null
     * isExecuting: boolean
     * error: string | null
   - Actions:
     * setQueryText(), setNResults()
     * addMetadataFilter(), updateMetadataFilter(), removeMetadataFilter()
     * addDocumentFilter(), updateDocumentFilter(), removeDocumentFilter()
     * executeQuery(), clearQuery(), clearResults()
   - Persist query to localStorage (restore on app restart)

2. Design query builder UI with tabs:
   - Tab 1: Similarity Search
   - Tab 2: Metadata Filters
   - Tab 3: Document Filters
   - Tab 4: Combined Query & Results
   - Use Shadcn/ui Tabs component
   - Show active tab indicator
   - Disable tabs when query is executing

3. Build src/components/query/QueryBuilder.tsx:
   - Container component with tab navigation
   - Header: Collection selector dropdown + Execute button
   - Tab content area
   - Footer: Query JSON preview (collapsible)
   - Execute button:
     * Primary style, large size
     * Show loading spinner when executing
     * Disabled when no query defined or collection not selected
   - Clear Query button

4. Build src/components/query/SimilaritySearch.tsx:
   - Query text input:
     * Large textarea (4 rows)
     * Placeholder: "Enter text to find similar documents..."
     * Character count indicator
   - Number of results:
     * Slider (1-100)
     * Number input (synchronized with slider)
     * Default: 10
   - Advanced options (collapsible):
     * Manual embedding vector input (JSON array)
     * Toggle: Use custom embedding vs. auto-generate
   - Preview section:
     * Show query text
     * Show n_results value

5. Build src/components/query/FilterBuilder.tsx:
   - Visual metadata filter builder:
     * "Add Condition" button
     * Each condition row:
       - Field name input (text)
       - Operator dropdown: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
       - Value input (text, number, or JSON array for $in/$nin)
       - Delete button (X)
     * Logic operator between conditions: AND / OR toggle
   - Validation:
     * Field name required
     * Value required and must match operator type
     * For $in/$nin: parse JSON array
   - Preview:
     * Show generated ChromaDB where clause JSON

6. Document filter UI (similar to FilterBuilder):
   - Add condition rows for document text filters
   - Operators: $contains, $not_contains
   - Value: text input
   - Preview: Show whereDocument clause JSON

7. Build src/components/query/QueryResults.tsx:
   - Results table:
     * Columns: Document (text preview), Metadata, Distance (similarity score)
     * Sort by distance (ascending - most similar first)
     * Show distance as percentage if possible (e.g., 0.25 → 75% similar)
   - Result count: "Found 10 results"
   - No results state: "No documents match your query. Try adjusting your filters."
   - Actions:
     * View full document (opens DocumentDetail)
     * Export results (JSON/CSV)
     * Save query as template
   - Pagination if results > 100

8. Implement query execution:
   - Add IPC handler: query:execute
     * Parameters: collectionName, queryType, queryParams
     * Execute appropriate ChromaDB query method
     * Return results with distances
   - Create useQueryExecute() hook in use-chromadb.ts:
     * Use React Query mutation
     * Handle loading and error states
     * Update query-store with results

9. Query validation with Zod:
   - Validate query before execution:
     * Similarity search: queryText OR embedding vector required
     * Filters: field names must not be empty, values must match operator type
   - Show validation errors inline
   - Disable Execute button if validation fails

10. Query templates:
    - Save query button: Save current query with a name
    - Load query dropdown: Select from saved queries
    - Manage templates: List, rename, delete saved queries
    - Store templates in localStorage or electron-store
    - Template includes: all filters, n_results, query text

BEST PRACTICES:
- ✅ Validate query before execution (prevent invalid API calls)
- ✅ Show query JSON preview for learning/debugging
- ✅ Provide helpful placeholder text and examples
- ✅ Use debouncing for auto-preview (don't regenerate on every keystroke)
- ✅ Preserve query state when switching tabs
- ✅ Handle edge cases: empty query, invalid JSON, no collection selected
- ✅ Show clear error messages: "Cannot execute empty query", "Invalid metadata filter value"
- ✅ Make query builder keyboard-accessible
- ✅ Add keyboard shortcuts: Cmd/Ctrl+Enter to execute
- ✅ Highlight syntax in JSON preview

EXPECTED DELIVERABLES:
1. Visual query builder with 4 tabs
2. Similarity search with text input and n_results slider
3. Metadata filter builder with add/remove conditions
4. Document filter builder
5. Combined query view with JSON preview
6. Execute queries and display results
7. Export results to JSON/CSV
8. Save/load query templates
9. Comprehensive validation and error handling

VERIFICATION STEPS:
- Build a similarity search query and execute
- Add metadata filters ($eq, $gt, $in) and verify query generation
- Add document filters ($contains) and test
- Combine similarity + filters and verify results
- Save query template and reload it
- Test validation: try to execute empty query, invalid filter
- Export results and verify file contents
- Test with collection that has no matching documents
```

### Common Pitfalls to Avoid
- ❌ Not validating filter values (leads to API errors)
- ❌ Allowing execution of empty/invalid queries
- ❌ Not handling "no results" state
- ❌ Generating query JSON on every keystroke (performance)
- ❌ Not preserving query state when switching tabs
- ❌ Showing technical error messages to users

---

## 📋 Phase 6: Document CRUD Operations

**Status**: ✅ Completed (2026-01-08)
**Goal**: Add, edit, delete documents from UI with validation

### Tasks Checklist

- [x] 6.1 Extend chromadb-handler.ts with document CRUD
- [x] 6.2 Create mutation hooks in use-chromadb.ts
- [x] 6.3 Build DocumentEditor.tsx component
- [x] 6.4 Create add document dialog
- [x] 6.5 Implement edit document functionality
- [x] 6.6 Add delete confirmation dialog
- [x] 6.7 Implement bulk operations
- [x] 6.8 Create bulk import feature
- [x] 6.9 Add operation notifications
- [x] 6.10 Implement error handling for CRUD

### Production-Grade Prompt for Phase 6

```
I'm implementing Phase 6: Document CRUD Operations for the ChromaDB desktop app. Please help me build comprehensive document management with add, edit, delete, and bulk import capabilities:

REQUIREMENTS:
1. Extend electron/ipc/chromadb-handler.ts:
   - Add document:add handler:
     * Parameters: collectionName, { id?, document, metadata?, embedding? }
     * Auto-generate ID if not provided (UUID)
     * Validate: document (required), metadata (optional object), embedding (optional array)
     * Return: { success, documentId }
   - Add document:update handler:
     * Parameters: collectionName, documentId, { document?, metadata?, embedding? }
     * Only update provided fields
     * Return: { success }
   - Add document:delete handler:
     * Parameters: collectionName, documentIds (string[])
     * Support bulk delete
     * Return: { success, deletedCount }
   - Add document:bulk-import handler:
     * Parameters: collectionName, documents (array)
     * Batch insert (use ChromaDB add with arrays)
     * Return: { success, importedCount, errors? }

2. Create mutation hooks in use-chromadb.ts:
   - useAddDocument():
     * React Query mutation
     * Optimistic update: add to cache immediately
     * On success: invalidate useDocuments query
     * On error: rollback optimistic update, show error toast
   - useUpdateDocument():
     * Optimistic update
     * Invalidate both useDocuments and useDocument queries
   - useDeleteDocument():
     * Optimistic update: remove from cache
     * Support single or bulk delete
     * Invalidate useDocuments query
   - useBulkImport():
     * Show progress indicator
     * Return import statistics

3. Build src/components/documents/DocumentEditor.tsx:
   - Form fields:
     * Document ID (input with "Auto-generate" checkbox)
     * Document text (large textarea, 10 rows)
     * Metadata (JSON editor with syntax highlighting)
     * Embedding (collapsible section):
       - Option 1: Auto-generate from text
       - Option 2: Manual input (JSON array)
   - Form validation with Zod:
     * ID: optional, alphanumeric + underscore/hyphen
     * Document: required, non-empty string
     * Metadata: valid JSON object
     * Embedding: valid JSON array of numbers (if provided)
   - Real-time validation feedback
   - Character count for document text
   - JSON validation for metadata (show error if invalid)

4. Create add document dialog:
   - Modal dialog with DocumentEditor form
   - Title: "Add Document to [collection-name]"
   - Actions: Cancel, Add Document
   - Add Document button:
     * Disabled until form is valid
     * Show loading spinner when submitting
   - On success:
     * Close dialog
     * Show toast: "Document added successfully"
     * Refresh document grid
   - On error:
     * Keep dialog open
     * Show error message inline
     * Allow user to fix and retry

5. Implement edit document functionality:
   - Click "Edit" in document grid or detail view
   - Open dialog with DocumentEditor pre-filled
   - ID field disabled (cannot change ID)
   - Same validation as add
   - On success:
     * Update grid row
     * Show toast: "Document updated"
     * If detail view open, refresh it

6. Add delete confirmation dialog:
   - Single delete:
     * Title: "Delete Document?"
     * Message: "Are you sure you want to delete document '[id]'? This action cannot be undone."
     * Actions: Cancel, Delete
     * Delete button: destructive style (red)
   - Bulk delete:
     * Title: "Delete [N] Documents?"
     * Message: "Are you sure you want to delete [N] documents? This action cannot be undone."
     * Show list of document IDs (max 5, then "and N more...")
   - On confirm:
     * Show loading state
     * Execute delete
     * Show toast: "[N] document(s) deleted"
     * Refresh grid

7. Implement bulk operations:
   - Bulk delete:
     * Select multiple documents in grid (checkboxes)
     * Show "Delete Selected" button in toolbar
     * Click → confirmation dialog → delete
     * Deselect all after delete
   - Bulk export:
     * Export selected documents to JSON/CSV

8. Create bulk import feature:
   - "Import Documents" button in toolbar
   - File upload dialog:
     * Accept: .json, .csv
     * Drag & drop support
   - JSON format:
     * Array of objects: [{ id?, document, metadata?, embedding? }]
   - CSV format:
     * Columns: id, document, metadata (JSON string), embedding (JSON array string)
     * Parse with papaparse library
   - Validation:
     * Check file format
     * Validate each document
     * Show preview: "Ready to import [N] documents"
   - Import progress:
     * Progress bar (0-100%)
     * "Importing [X] of [N] documents..."
   - Import results:
     * Success: "Imported [N] documents successfully"
     * Partial success: "Imported [N] documents, [M] failed" + error list
     * Full error: Show first error with "View all errors" link

9. Add operation notifications:
   - Use toast library (sonner recommended)
   - Success toasts:
     * "Document added successfully"
     * "Document updated"
     * "[N] documents deleted"
     * "Imported [N] documents"
   - Error toasts:
     * "Failed to add document: [reason]"
     * "Failed to update document: [reason]"
     * Action button: "Retry"
   - Info toasts:
     * "Importing documents... [progress]"
   - Toast position: bottom-right
   - Auto-dismiss: 3 seconds (success), 5 seconds (error)

10. Error handling:
    - Handle all error scenarios:
      * Network error: "Cannot connect to ChromaDB"
      * Validation error: "Invalid document format"
      * Duplicate ID: "Document with this ID already exists"
      * Permission error: "You don't have permission to modify this collection"
    - Show user-friendly error messages
    - Provide actionable suggestions: "Check your connection and try again"
    - Log detailed errors to console for debugging

BEST PRACTICES:
- ✅ Implement optimistic updates for instant UI feedback
- ✅ Validate all inputs before submission (client-side + server-side)
- ✅ Show loading states for all async operations
- ✅ Use confirmation dialogs for destructive actions
- ✅ Provide undo option for destructive actions (if feasible)
- ✅ Handle partial failures in bulk operations gracefully
- ✅ Use proper error boundaries to catch unexpected errors
- ✅ Debounce JSON validation (don't validate on every keystroke)
- ✅ Use Monaco editor for JSON editing (better UX)
- ✅ Add keyboard shortcuts: Cmd/Ctrl+S to save, Escape to cancel

EXPECTED DELIVERABLES:
1. Add single document with form validation
2. Edit existing document
3. Delete document(s) with confirmation
4. Bulk delete multiple documents
5. Bulk import from JSON/CSV with progress indicator
6. Toast notifications for all operations
7. Comprehensive error handling
8. Optimistic updates for instant feedback

VERIFICATION STEPS:
- Add a new document and verify it appears in grid
- Edit document and verify changes persist
- Delete single document with confirmation
- Select multiple documents and bulk delete
- Import documents from JSON file (valid and invalid)
- Import documents from CSV file
- Test validation: try invalid JSON metadata, empty document text
- Test error scenarios: duplicate ID, network failure
- Verify optimistic updates work (UI updates immediately)
- Verify rollback works when operation fails
```

### Common Pitfalls to Avoid
- ❌ Not validating inputs (causes API errors)
- ❌ No confirmation for destructive actions
- ❌ Not showing operation progress (feels unresponsive)
- ❌ Not handling partial failures in bulk operations
- ❌ Not rolling back optimistic updates on error
- ❌ Showing technical error messages to users

---

## 📋 Phase 7: Embeddings Visualization

**Status**: ⏳ Not Started
**Goal**: Visualize embeddings in interactive 2D scatter plots

### Tasks Checklist

- [ ] 7.1 Install Recharts
- [ ] 7.2 Create PCA utility for dimensionality reduction
- [ ] 7.3 Build EmbeddingPlot.tsx component
- [ ] 7.4 Add interactive features (hover, click)
- [ ] 7.5 Implement similarity highlighting
- [ ] 7.6 Create embedding comparison tool
- [ ] 7.7 Add embedding statistics view
- [ ] 7.8 Implement export functionality
- [ ] 7.9 Optimize performance with Web Workers
- [ ] 7.10 Add loading states for computation

### Production-Grade Prompt for Phase 7

```
I'm implementing Phase 7: Embeddings Visualization for the ChromaDB desktop app. Please help me build an interactive embedding visualization system with 2D scatter plots:

REQUIREMENTS:
1. Install Recharts:
   - npm install recharts

2. Create src/lib/pca.ts:
   - Implement PCA (Principal Component Analysis) for dimensionality reduction
   - Function: reduceTo2D(embeddings: number[][]): { x: number, y: number }[]
   - Algorithm:
     * Center the data (subtract mean)
     * Compute covariance matrix
     * Compute eigenvectors and eigenvalues
     * Project onto top 2 principal components
   - Handle edge cases: embeddings with < 2 dimensions (pad with zeros)
   - Normalize output to [0, 1] range for better visualization

3. Create src/components/documents/EmbeddingPlot.tsx:
   - Accept props:
     * embeddings: { id: string, vector: number[], document: string, metadata: any }[]
     * selectedId?: string (highlight selected document)
     * onPointClick?: (id: string) => void
   - Component structure:
     * Controls section:
       - "Reduce to 2D" button (run PCA)
       - Loading indicator during computation
       - Zoom controls (+/-)
       - Reset view button
     * Plot area:
       - Recharts ScatterChart
       - X/Y axes with labels
       - Grid lines
       - Responsive size (fill parent)
   - Data processing:
     * If embeddings > 2D: show "Reduce to 2D" button
     * If embeddings = 2D: plot directly
     * Compute PCA on button click (show loading spinner)
   - Point rendering:
     * Default: blue circles (radius: 5)
     * Hovered: orange, larger (radius: 7)
     * Selected: red, largest (radius: 9)
     * Show document preview on hover (tooltip)

4. Add interactive features:
   - Hover tooltips:
     * Show document preview (first 100 chars)
     * Show metadata (formatted JSON)
     * Show distance from selected point (if any)
   - Click actions:
     * Click point → call onPointClick(id)
     * Opens DocumentDetail panel
   - Zoom and pan:
     * Mouse wheel to zoom
     * Click + drag to pan
     * Reset button to restore original view
   - Responsive:
     * Resize plot when container changes
     * Maintain aspect ratio

5. Implement similarity highlighting:
   - When a point is selected:
     * Calculate distance to all other points
     * Color points by similarity:
       - Very similar (distance < 0.2): green
       - Similar (0.2 <= distance < 0.5): yellow
       - Different (distance >= 0.5): blue
   - Show legend explaining colors
   - Display distance value on hover

6. Create embedding comparison tool:
   - src/components/documents/EmbeddingCompare.tsx:
   - Select two documents to compare
   - Side-by-side display:
     * Document 1 text and metadata
     * Document 2 text and metadata
   - Visualization:
     * Highlight both points on plot (different colors)
     * Draw line between them
     * Show distance value on line
   - Statistics:
     * Cosine similarity
     * Euclidean distance
     * Vector magnitude for each

7. Add embedding statistics view:
   - src/components/documents/EmbeddingStats.tsx:
   - Display statistics:
     * Dimension count
     * Min/max values per dimension
     * Mean and standard deviation
     * Vector magnitude distribution (histogram)
   - Dimension heatmap:
     * Show which dimensions have highest variance
     * Help identify important features

8. Implement export functionality:
   - Export plot as image:
     * PNG format (use html-to-image library)
     * Button: "Export as PNG"
   - Export reduced embeddings:
     * CSV format: id, x, y, document_preview
     * Button: "Export 2D Coordinates"
   - Export full data:
     * JSON format: all embeddings + metadata

9. Optimize performance with Web Workers:
   - PCA computation can be slow for large datasets (1000+ embeddings)
   - Move PCA computation to Web Worker:
     * Create src/workers/pca.worker.ts
     * Post embeddings to worker
     * Receive reduced coordinates
   - Show progress indicator:
     * "Computing PCA... [progress]%"
   - Limit visualization to N documents:
     * If > 1000 documents, use sampling
     * Select representative subset (random or stratified)
     * Show message: "Displaying 1000 of [N] documents"

10. Add loading states:
    - Initial load: skeleton loader for plot area
    - PCA computation: progress bar with percentage
    - Hover interaction: smooth transitions (CSS)
    - Data update: fade out old plot, fade in new plot

BEST PRACTICES:
- ✅ Use Web Workers for heavy computation (don't block UI)
- ✅ Sample large datasets (don't plot 10,000 points)
- ✅ Normalize coordinates for better visualization
- ✅ Use responsive design (plot resizes with container)
- ✅ Implement smooth animations for interactions
- ✅ Show loading states for async operations
- ✅ Provide export options for further analysis
- ✅ Handle edge cases: no embeddings, 1D embeddings, identical embeddings
- ✅ Use color-blind friendly palette
- ✅ Add accessibility: keyboard navigation, screen reader support

PERFORMANCE CONSIDERATIONS:
- Limit plot to 1000 points max (sample if more)
- Use React.memo for plot component
- Debounce zoom/pan operations
- Compute PCA in Web Worker (non-blocking)
- Cache PCA results (don't recompute on every render)
- Use requestAnimationFrame for smooth animations

EXPECTED DELIVERABLES:
1. Interactive 2D scatter plot of embeddings
2. PCA dimensionality reduction for high-dimensional embeddings
3. Hover tooltips showing document previews
4. Click to view full document
5. Similarity highlighting (color by distance)
6. Embedding comparison tool (compare two documents)
7. Embedding statistics view
8. Export plot as PNG and data as CSV/JSON
9. Good performance with 1000+ documents
10. Loading states and error handling

VERIFICATION STEPS:
- Load collection with embeddings and visualize
- Verify PCA reduces high-dimensional embeddings to 2D
- Hover over points and verify tooltips show correctly
- Click point and verify DocumentDetail opens
- Select point and verify similarity highlighting works
- Compare two documents and verify distance calculation
- Export plot as PNG and verify image quality
- Export 2D coordinates as CSV and verify format
- Test with large dataset (1000+ documents)
- Verify Web Worker doesn't block UI during PCA
```

### Common Pitfalls to Avoid
- ❌ Not using Web Workers (blocks UI with large datasets)
- ❌ Plotting too many points (performance issues)
- ❌ Not normalizing coordinates (poor visualization)
- ❌ Not handling edge cases (1D embeddings, no embeddings)
- ❌ Forgetting to cache PCA results (recomputes unnecessarily)
- ❌ Not making plot responsive (fixed size)

---

## 📋 Phase 8: Polish & Error Handling

**Status**: ✅ Completed (2026-01-08)
**Goal**: Professional UX with comprehensive error handling and accessibility

### Tasks Checklist

- [x] 8.1 Implement global error boundary
- [x] 8.2 Add consistent loading states (skeletons)
- [x] 8.3 Create notification system (toasts)
- [x] 8.4 Implement keyboard shortcuts
- [ ] 8.5 Create application menu (Deferred - Electron menu not critical for MVP)
- [ ] 8.6 Add empty states with guidance (Partially done in existing components)
- [x] 8.7 Improve error messages
- [x] 8.8 Add input validation messages
- [x] 8.9 Implement accessibility improvements
- [ ] 8.10 Add loading progress indicators (Partially done with skeletons)

### Production-Grade Prompt for Phase 8

```
I'm implementing Phase 8: Polish & Error Handling for the ChromaDB desktop app. Please help me add professional touches, comprehensive error handling, and accessibility improvements:

REQUIREMENTS:
1. Implement global error boundary:
   - src/components/layout/ErrorBoundary.tsx:
     * Catch React component errors
     * Display user-friendly error page
     * Show error message and stack trace (in dev mode)
     * "Reload App" button to recover
     * Report errors to console with context
   - Wrap entire app in ErrorBoundary (App.tsx)
   - Add error boundaries for major sections (sidebar, main content)

2. Add consistent loading states:
   - Create skeleton loaders:
     * CollectionListSkeleton: sidebar with animated placeholders
     * DocumentGridSkeleton: grid with shimmer effect
     * DocumentDetailSkeleton: detail panel skeleton
   - Use Shadcn/ui Skeleton component
   - Show skeletons during initial data fetch
   - Replace with actual content when loaded
   - Smooth transition (fade in)

3. Create notification system:
   - Install sonner: npm install sonner
   - Configure Toaster in App.tsx
   - Create toast wrapper: src/lib/toast.ts
     * Success toast: green, checkmark icon
     * Error toast: red, X icon
     * Info toast: blue, info icon
     * Warning toast: yellow, warning icon
   - Position: bottom-right
   - Auto-dismiss: 3s (success), 5s (error), persisted (warning)
   - Max toasts: 3 (queue others)
   - Actions: Retry, Dismiss, Undo (where applicable)

4. Implement keyboard shortcuts:
   - Install react-hotkeys-hook
   - Global shortcuts:
     * Cmd/Ctrl+K: Open quick search
     * Cmd/Ctrl+Shift+C: New connection
     * Cmd/Ctrl+N: New collection/document (context-aware)
     * Cmd/Ctrl+R: Refresh current view
     * Cmd/Ctrl+F: Search in grid
     * Cmd/Ctrl+Enter: Execute query (in query builder)
     * Escape: Close dialog/modal
     * Cmd/Ctrl+,: Open settings
   - Show keyboard shortcut hints in menus and tooltips
   - Add "Keyboard Shortcuts" help dialog (Cmd/Ctrl+/)

5. Create application menu:
   - electron/menu/app-menu.ts:
   - File menu:
     * New Connection (Cmd/Ctrl+Shift+C)
     * Settings (Cmd/Ctrl+,)
     * Separator
     * Quit (Cmd/Ctrl+Q)
   - Edit menu:
     * Undo, Redo, Cut, Copy, Paste, Select All (standard)
   - View menu:
     * Toggle Sidebar (Cmd/Ctrl+B)
     * Refresh (Cmd/Ctrl+R)
     * Separator
     * Actual Size, Zoom In, Zoom Out
     * Toggle Developer Tools (Cmd/Ctrl+Shift+I)
   - Help menu:
     * Documentation
     * Keyboard Shortcuts
     * About
   - macOS: Add app menu with standard items
   - Implement menu actions in IPC handlers

6. Add empty states with guidance:
   - No connections:
     * Icon: plug icon
     * Title: "No Connections Configured"
     * Message: "Connect to a ChromaDB instance to get started"
     * Action: "Add Connection" button
   - No collections:
     * Icon: folder icon
     * Title: "No Collections Found"
     * Message: "This ChromaDB instance has no collections yet"
     * Action: "Create Collection" button
   - No documents:
     * Icon: document icon
     * Title: "No Documents in Collection"
     * Message: "Add your first document to this collection"
     * Actions: "Add Document" or "Import Documents" buttons
   - No query results:
     * Icon: search icon
     * Title: "No Results Found"
     * Message: "Try adjusting your query parameters"
     * Action: "Clear Query" button

7. Improve error messages:
   - Create error message mapping:
     * Network errors:
       - "ECONNREFUSED" → "Cannot connect to ChromaDB. Is the server running?"
       - "ETIMEDOUT" → "Connection timed out. Check your network connection."
     * ChromaDB errors:
       - "Collection not found" → "The collection '[name]' does not exist"
       - "Duplicate key" → "A document with this ID already exists"
     * Validation errors:
       - Show field-specific errors inline
   - Add actionable suggestions:
     * Network error: "Check your connection settings and try again"
     * Auth error: "Verify your authentication token"
   - Include error codes for support/debugging

8. Add input validation messages:
   - Real-time validation for all forms:
     * Show error message below field
     * Red border on invalid field
     * Green checkmark on valid field
   - Validation rules:
     * Collection name: alphanumeric + underscore, 1-63 chars
     * Document ID: alphanumeric + underscore/hyphen
     * Connection host: valid hostname or IP
     * Connection port: 1-65535
     * JSON fields: valid JSON syntax
   - Error message examples:
     * "Collection name must be alphanumeric and underscores only"
     * "Port must be between 1 and 65535"
     * "Invalid JSON syntax at line 3, column 5"

9. Implement accessibility improvements:
   - ARIA labels:
     * All buttons have aria-label
     * Form inputs have aria-describedby for errors
     * Dialogs have aria-labelledby and aria-describedby
   - Keyboard navigation:
     * All interactive elements focusable with Tab
     * Modal dialogs trap focus
     * Skip links to main content
     * Focus visible indicator (outline)
   - Screen reader support:
     * Announce dynamic content changes (toast notifications)
     * Loading states announced
     * Error messages announced
   - Color contrast:
     * Ensure WCAG AA compliance (4.5:1 for text)
     * Don't rely on color alone (use icons too)
   - Font sizes:
     * Minimum 14px for body text
     * Support zoom up to 200%

10. Add loading progress indicators:
    - Long operations (> 2s) show progress:
      * Bulk import: progress bar with percentage
      * PCA computation: progress bar
      * Large query execution: indeterminate progress
    - Use Shadcn/ui Progress component
    - Show operation details:
      * "Importing documents... 45/100"
      * "Computing embeddings... 2/3"
    - Allow cancellation for long operations

BEST PRACTICES:
- ✅ Always provide feedback for user actions (loading, success, error)
- ✅ Use consistent loading patterns (skeletons > spinners)
- ✅ Show actionable error messages (not technical stack traces)
- ✅ Implement keyboard shortcuts for power users
- ✅ Add empty states to guide users
- ✅ Ensure accessibility for all users
- ✅ Handle edge cases gracefully
- ✅ Test error scenarios thoroughly
- ✅ Log errors for debugging (console.error with context)
- ✅ Use optimistic updates but rollback on error

EXPECTED DELIVERABLES:
1. Global error boundary catching React errors
2. Skeleton loaders for all major components
3. Toast notification system (success, error, info)
4. Comprehensive keyboard shortcuts
5. Application menu with standard items
6. Helpful empty states throughout app
7. User-friendly error messages with suggestions
8. Real-time input validation messages
9. WCAG AA accessibility compliance
10. Progress indicators for long operations

VERIFICATION STEPS:
- Trigger React error and verify error boundary shows
- Load app and verify skeletons show before data
- Test all keyboard shortcuts
- Check application menu items work
- View empty states (no connections, collections, documents)
- Test error scenarios (network failure, invalid input)
- Verify error messages are helpful
- Test form validation (try invalid inputs)
- Test with keyboard only (no mouse)
- Test with screen reader (NVDA/VoiceOver)
- Verify color contrast meets WCAG standards
- Test long operations (bulk import, PCA) show progress
```

### Common Pitfalls to Avoid
- ❌ Showing technical error messages to users
- ❌ Not providing loading feedback (feels broken)
- ❌ No empty states (users confused when no data)
- ❌ Keyboard navigation broken or missing
- ❌ Poor color contrast (accessibility issue)
- ❌ Not announcing dynamic changes to screen readers
- ❌ No way to cancel long operations

---

## 📋 Phase 9: Testing

**Status**: ⏳ Not Started
**Goal**: Comprehensive test coverage (>80%) with unit, integration, and E2E tests

### Tasks Checklist

- [ ] 9.1 Install testing dependencies (Vitest, Testing Library, Playwright)
- [ ] 9.2 Write unit tests for utilities and stores
- [ ] 9.3 Write component tests
- [ ] 9.4 Write integration tests
- [ ] 9.5 Write E2E tests with Playwright
- [ ] 9.6 Test IPC communication
- [ ] 9.7 Test security (credential storage)
- [ ] 9.8 Performance testing
- [ ] 9.9 Cross-platform testing
- [ ] 9.10 Set up CI/CD (optional)

### Production-Grade Prompt for Phase 9

```
I'm implementing Phase 9: Testing for the ChromaDB desktop app. Please help me set up comprehensive testing with high coverage and quality:

REQUIREMENTS:
1. Install testing dependencies:
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright @playwright/test
   ```

2. Configure Vitest:
   - Create vitest.config.ts:
     * Configure for React components
     * Set up jsdom environment
     * Configure coverage reporting (istanbul)
     * Set up test globals
   - Add test scripts to package.json:
     * "test": "vitest"
     * "test:ui": "vitest --ui"
     * "test:coverage": "vitest --coverage"

3. Write unit tests for utilities and stores:
   - tests/unit/lib/pca.test.ts:
     * Test PCA dimensionality reduction
     * Test with 2D, 3D, high-dimensional data
     * Test edge cases: empty array, single vector, identical vectors
   - tests/unit/stores/connection-store.test.ts:
     * Test addConnection, updateConnection, deleteConnection
     * Test setActiveConnection
     * Test persistence to localStorage
   - tests/unit/stores/query-store.test.ts:
     * Test query building (filters, conditions)
     * Test query execution
     * Test state updates
   - tests/unit/lib/utils.test.ts:
     * Test utility functions
   - Target: >90% coverage for utilities

4. Write component tests:
   - tests/components/connections/ConnectionDialog.test.tsx:
     * Test form rendering
     * Test form validation (invalid host, port)
     * Test submission
     * Test "Test Connection" button
   - tests/components/collections/CollectionList.test.tsx:
     * Test collection rendering
     * Test search/filter
     * Test empty state
     * Test loading state
   - tests/components/documents/DocumentGrid.test.tsx:
     * Test grid rendering with mock data
     * Test pagination
     * Test selection
     * Test export functionality
   - tests/components/query/QueryBuilder.test.tsx:
     * Test query building
     * Test validation
     * Test execution
   - Use Testing Library best practices:
     * Query by role, label, text (not test IDs)
     * User events (fireEvent vs userEvent)
     * Async utilities (waitFor, findBy)
   - Target: >80% coverage for components

5. Write integration tests:
   - tests/integration/connection-flow.test.tsx:
     * User creates connection
     * Test connection succeeds
     * Save connection
     * Switch to connection
     * Verify active connection updates
   - tests/integration/collection-crud.test.tsx:
     * User creates collection
     * View collection details
     * Update collection metadata
     * Delete collection
     * Verify all operations work end-to-end
   - tests/integration/document-crud.test.tsx:
     * Add document
     * Edit document
     * Delete document
     * Bulk import
     * Verify all operations work
   - tests/integration/query-execution.test.tsx:
     * Build similarity query
     * Add metadata filters
     * Execute query
     * Verify results display
   - Mock IPC communication:
     * Use vitest.mock() for electron IPC
     * Return mock ChromaDB responses
   - Target: >70% coverage for integration flows

6. Write E2E tests with Playwright:
   - tests/e2e/app.spec.ts:
     * Test app launches successfully
     * Test window creation
   - tests/e2e/connection.spec.ts:
     * Full connection flow (create, test, connect)
     * Requires local ChromaDB running
   - tests/e2e/collection-management.spec.ts:
     * Create collection
     * View collections list
     * Delete collection
   - tests/e2e/document-operations.spec.ts:
     * Add document
     * View in grid
     * Edit document
     * Delete document
   - tests/e2e/query-builder.spec.ts:
     * Build query
     * Execute query
     * View results
   - Configure Playwright:
     * Set up electron launcher
     * Configure for all platforms (if possible)
     * Use page objects for maintainability
   - Target: Critical user journeys covered

7. Test IPC communication:
   - tests/unit/ipc/chromadb-handler.test.ts:
     * Test collection:list handler
     * Test collection:create handler
     * Test document:query handler
     * Mock ChromaDB client responses
     * Test error handling
   - tests/unit/ipc/connection-handler.test.ts:
     * Test connection:test handler
     * Test connection:create handler
     * Test connection:list handler
   - Verify Zod validation works
   - Test error scenarios (network error, invalid input)

8. Test security:
   - tests/security/credential-storage.test.ts:
     * Verify credentials stored in keychain (not localStorage or files)
     * Verify credentials never sent to renderer
     * Test credential encryption
   - tests/security/context-isolation.test.ts:
     * Verify context isolation enabled
     * Verify nodeIntegration disabled
     * Test IPC security (only allowed channels work)
   - Manual testing:
     * Check localStorage/sessionStorage for credentials
     * Check JSON files for credentials
     * Verify keychain storage on macOS/Windows/Linux

9. Performance testing:
   - tests/performance/large-dataset.test.ts:
     * Load collection with 10,000+ documents
     * Measure grid render time (should be < 1s)
     * Measure query execution time
     * Measure PCA computation time
   - tests/performance/memory.test.ts:
     * Monitor memory usage during operations
     * Verify no memory leaks (heap snapshots)
   - Use Chrome DevTools Performance profiler
   - Target benchmarks:
     * Grid render with 1000 rows: < 500ms
     * Query execution: < 2s
     * PCA (1000 vectors): < 3s

10. Cross-platform testing:
    - Test on all platforms:
      * macOS (primary development platform)
      * Windows (VM or CI)
      * Linux (VM or CI)
    - Platform-specific tests:
      * Credential storage (keychain, credential vault, secret service)
      * File paths (/ vs \)
      * Keyboard shortcuts (Cmd vs Ctrl)
    - Optional: Set up GitHub Actions CI:
      * Run tests on all platforms automatically
      * Generate coverage reports
      * Fail PR if tests fail or coverage drops

BEST PRACTICES:
- ✅ Write tests first (TDD) or alongside code
- ✅ Aim for high coverage but focus on critical paths
- ✅ Test user behavior, not implementation details
- ✅ Use descriptive test names (it("should X when Y"))
- ✅ Mock external dependencies (ChromaDB, IPC)
- ✅ Use factories/fixtures for test data
- ✅ Test both happy path and error scenarios
- ✅ Keep tests fast (unit tests < 100ms)
- ✅ Use beforeEach/afterEach for setup/cleanup
- ✅ Run tests in CI/CD pipeline

EXPECTED DELIVERABLES:
1. Vitest configured with coverage reporting
2. Unit tests for utilities, stores (>90% coverage)
3. Component tests for major components (>80% coverage)
4. Integration tests for critical flows (>70% coverage)
5. E2E tests for user journeys (critical paths covered)
6. IPC communication tests
7. Security tests (credential storage, context isolation)
8. Performance benchmarks
9. Cross-platform testing (macOS, Windows, Linux)
10. CI/CD setup (optional)

VERIFICATION STEPS:
- Run `npm test` and verify all tests pass
- Run `npm run test:coverage` and verify >80% overall coverage
- Run `npm run test:ui` and review test results
- Run E2E tests and verify user flows work
- Test on different platforms
- Verify security tests pass (no credentials in localStorage/files)
- Run performance tests and verify benchmarks met
- Check CI/CD pipeline runs tests on each commit
```

### Common Pitfalls to Avoid
- ❌ Testing implementation details instead of behavior
- ❌ Not mocking external dependencies (slow tests)
- ❌ Not testing error scenarios
- ❌ Brittle tests that break on small changes
- ❌ Not cleaning up after tests (memory leaks)
- ❌ Low coverage of critical code paths

---

## 📋 Phase 10: Production Build & Distribution

**Status**: ⏳ Not Started
**Goal**: Production-ready installers for macOS, Windows, Linux

### Tasks Checklist

- [x] 10.1 Configure electron-builder.yml
- [x] 10.2 Create application icons
- [ ] 10.3 Set up code signing (optional - requires Apple Developer / Windows cert)
- [x] 10.4 Configure auto-updater (private GitHub repo with GH_TOKEN)
- [x] 10.5 Build for macOS (native: `npm run build:mac`)
- [x] 10.6 Build for Windows (Docker: `npm run build:docker:win`)
- [x] 10.7 Build for Linux (Docker: `npm run build:docker:linux`)
- [ ] 10.8 Test installers on each platform
- [ ] 10.9 Create user documentation
- [x] 10.10 Optimize bundle size and create distribution package

### Production-Grade Prompt for Phase 10

```
I'm implementing Phase 10: Production Build & Distribution for the ChromaDB desktop app. Please help me create production-ready installers for all platforms:

REQUIREMENTS:
1. Configure electron-builder.yml:
   ```yaml
   appId: com.chromadb.ui
   productName: ChromaDB UI
   copyright: Copyright © 2024
   directories:
     output: dist
     buildResources: build

   files:
     - "!**/.git/*"
     - "!**/.vscode/*"
     - "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"
     - "!**/node_modules/.bin"
     - "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}"
     - "!.editorconfig"
     - "!**/._*"
     - "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}"
     - "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}"
     - "!**/{appveyor.yml,.travis.yml,circle.yml}"
     - "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"

   mac:
     category: public.app-category.developer-tools
     target:
       - dmg
       - zip
     icon: build/icon.icns
     hardenedRuntime: true
     gatekeeperAssess: false
     entitlements: build/entitlements.mac.plist
     entitlementsInherit: build/entitlements.mac.plist

   dmg:
     contents:
       - x: 410
         y: 150
         type: link
         path: /Applications
       - x: 130
         y: 150
         type: file

   win:
     target:
       - nsis
       - portable
     icon: build/icon.ico

   nsis:
     oneClick: false
     allowToChangeInstallationDirectory: true
     installerIcon: build/icon.ico
     uninstallerIcon: build/icon.ico
     artifactName: ${productName}-${version}-Setup.${ext}

   linux:
     target:
       - AppImage
       - deb
     icon: build/icon.png
     category: Development
   ```

2. Create application icons:
   - Design 1024x1024px icon:
     * Logo representing ChromaDB + UI
     * Simple, recognizable design
     * Works at small sizes (16x16)
   - Generate icon sets:
     * macOS: icon.icns (from 1024x1024 PNG)
       - Use `png2icons` or Sketch/Figma export
       - Sizes: 16, 32, 64, 128, 256, 512, 1024
     * Windows: icon.ico (from 1024x1024 PNG)
       - Use `png-to-ico` or online tool
       - Sizes: 16, 32, 48, 64, 128, 256
     * Linux: icon.png (512x512 and 1024x1024)
   - Place in build/ directory

3. Set up code signing (optional but recommended):
   - macOS:
     * Get Developer ID certificate from Apple Developer
     * Install certificate in Keychain
     * Configure electron-builder:
       ```yaml
       mac:
         identity: "Developer ID Application: Your Name (TEAM_ID)"
       ```
     * Notarize app (required for macOS 10.15+):
       ```yaml
       afterSign: "scripts/notarize.js"
       ```
   - Windows:
     * Get code signing certificate (DigiCert, etc.)
     * Configure electron-builder:
       ```yaml
       win:
         certificateFile: "path/to/cert.pfx"
         certificatePassword: ${env.CERT_PASSWORD}
       ```
   - Note: Code signing prevents "unverified developer" warnings

4. Configure auto-updater (optional):
   - Install electron-updater:
     ```bash
     npm install electron-updater
     ```
   - Configure in electron-builder.yml:
     ```yaml
     publish:
       - provider: github
         owner: your-username
         repo: chromadb-ui
         releaseType: release
     ```
   - Implement auto-update in main.ts:
     * Check for updates on startup
     * Download in background
     * Prompt user to restart and install
   - Create update checking UI

5. Build for macOS:
   - Add build script to package.json:
     ```json
     "build:mac": "npm run build && electron-builder --mac"
     ```
   - Run: `npm run build:mac`
   - Outputs:
     * dist/ChromaDB UI-1.0.0.dmg
     * dist/ChromaDB UI-1.0.0-mac.zip
   - Test:
     * Mount DMG and verify app installs
     * Run app and verify functionality
     * Check app is signed: `codesign -dv --verbose=4 "ChromaDB UI.app"`

6. Build for Windows:
   - Add build script:
     ```json
     "build:win": "npm run build && electron-builder --win"
     ```
   - Run: `npm run build:win`
   - Outputs:
     * dist/ChromaDB UI Setup 1.0.0.exe (installer)
     * dist/ChromaDB UI 1.0.0.exe (portable)
   - Test on Windows:
     * Run installer and verify installation
     * Test portable version
     * Verify app functionality

7. Build for Linux:
   - Add build script:
     ```json
     "build:linux": "npm run build && electron-builder --linux"
     ```
   - Run: `npm run build:linux`
   - Outputs:
     * dist/ChromaDB UI-1.0.0.AppImage
     * dist/chromadb-ui_1.0.0_amd64.deb
   - Test on Linux:
     * Run AppImage: `chmod +x ChromaDB-UI-1.0.0.AppImage && ./ChromaDB-UI-1.0.0.AppImage`
     * Install deb: `sudo dpkg -i chromadb-ui_1.0.0_amd64.deb`
     * Verify app functionality

8. Test installers on each platform:
   - First launch experience:
     * App opens without errors
     * No connection configured (empty state)
     * "Add Connection" works
   - Installation:
     * Installer UI is professional
     * App installs to correct location
     * Desktop shortcut/dock icon created
     * Uninstaller works correctly
   - Updates (if implemented):
     * Auto-update checks for new version
     * Update downloads and installs
     * App relaunches successfully
   - Permissions:
     * Keychain access works (credentials stored)
     * Network access works (connect to ChromaDB)
     * File system access works (import/export)

9. Create user documentation:
   - README.md:
     * App description and features
     * Screenshots (connection dialog, collection list, document grid)
     * System requirements
     * Installation instructions for each platform
     * Quick start guide
     * Troubleshooting section
     * Links to documentation and support
   - CHANGELOG.md:
     * Version history
     * Features, improvements, bug fixes for each version
   - LICENSE:
     * Choose open source license (MIT, Apache 2.0, GPL)
   - CONTRIBUTING.md (if open source):
     * How to contribute
     * Development setup
     * Coding standards

10. Optimize bundle size and create distribution:
    - Analyze bundle:
      ```bash
      npm run build
      npx vite-bundle-visualizer
      ```
    - Optimizations:
      * Remove unused dependencies
      * Use dynamic imports for large components
      * Optimize images (compress, use WebP)
      * Remove source maps from production build
      * Tree-shake unused code
    - Target: Total app size < 150MB (macOS), < 100MB (Windows/Linux)
    - Create release:
      * Tag version: `git tag v1.0.0`
      * Push tag: `git push origin v1.0.0`
      * Create GitHub release with installers
      * Write release notes (features, known issues, breaking changes)
    - Distribution:
      * Upload to GitHub releases
      * Optional: Publish to app stores (Mac App Store, Microsoft Store, Snapcraft)

BEST PRACTICES:
- ✅ Test installers on clean machines (no dev tools)
- ✅ Sign applications to avoid security warnings
- ✅ Provide clear installation instructions
- ✅ Include screenshots in documentation
- ✅ Version your releases (semantic versioning)
- ✅ Maintain a changelog
- ✅ Optimize bundle size (remove unused code)
- ✅ Test first-launch experience
- ✅ Implement auto-updates for seamless upgrades
- ✅ Provide troubleshooting documentation

EXPECTED DELIVERABLES:
1. electron-builder.yml configured
2. Application icons for all platforms
3. (Optional) Code signing certificates configured
4. (Optional) Auto-updater implemented
5. macOS installers: DMG, ZIP
6. Windows installers: NSIS, portable
7. Linux installers: AppImage, deb
8. Tested installers on all platforms
9. Comprehensive README.md with screenshots
10. Release packages on GitHub

VERIFICATION STEPS:
- Build for all platforms successfully
- Test each installer on clean machine
- Verify app launches without errors
- Verify all features work in production build
- Check bundle size is reasonable
- Verify code signing (no warnings)
- Test auto-update flow (if implemented)
- Review documentation for completeness
- Create GitHub release with installers
- Test download and install from release
```

### Common Pitfalls to Avoid
- ❌ Not testing on clean machines (missing dependencies)
- ❌ Including development files in build (bloat)
- ❌ Not code signing (security warnings)
- ❌ Missing or incomplete documentation
- ❌ Not optimizing bundle size
- ❌ Not testing first-launch experience
- ❌ Missing uninstaller or broken uninstall

---

## 📝 Notes & Tips

### Context Management Between Sessions
- **Always check TODO.md first** when starting work
- Mark tasks as completed: Change `[ ]` to `[x]`
- Update "Current Phase" and "Last Updated" at top
- Add notes about blockers or issues encountered
- Reference commit hashes for major milestones

### Using the Prompts
- Copy the "Production-Grade Prompt" for each phase
- Paste into Claude or your AI assistant
- The prompt includes all requirements, best practices, and verification steps
- Modify prompt based on your specific needs

### Best Practices Across All Phases
1. **Type Safety**: Use TypeScript strict mode, avoid `any`
2. **Error Handling**: Always handle errors gracefully with user-friendly messages
3. **Loading States**: Show loading feedback for all async operations
4. **Validation**: Validate all inputs (Zod for runtime validation)
5. **Security**: Never store credentials in localStorage or JSON files
6. **Performance**: Optimize for large datasets (virtual scrolling, pagination)
7. **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
8. **Testing**: Write tests alongside code, aim for >80% coverage

### Common Dependencies
```bash
# Core
npm install react react-dom react-router-dom
npm install chromadb zustand @tanstack/react-query
npm install zod clsx tailwind-merge

# UI
npm install ag-grid-react ag-grid-community
npm install lucide-react recharts sonner

# Electron
npm install electron electron-store keytar

# Dev
npm install -D typescript vite electron-vite
npm install -D tailwindcss postcss autoprefixer
npm install -D eslint prettier vitest playwright
npm install -D @types/react @types/react-dom @types/node
```

### Troubleshooting
- **IPC not working**: Check context isolation is enabled, verify preload script
- **Credentials not saving**: Check keychain permissions, verify keytar installed correctly
- **Performance issues**: Enable virtual scrolling, reduce data fetched per request
- **Build failing**: Clear dist/ and node_modules/, reinstall dependencies
- **Tests failing**: Check mocks are set up correctly, verify async operations use waitFor

### Resources
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [AG Grid React](https://www.ag-grid.com/react-data-grid/)

---

## Success Criteria

✅ **Phase Complete When:**
- All tasks checked off
- All deliverables working as expected
- All verification steps pass
- No critical bugs or errors
- Code follows best practices
- Documentation updated

🎯 **Project Complete When:**
- All 10 phases checked off
- App launches on all platforms
- All core features working
- Tests passing (>80% coverage)
- Production builds created
- Documentation complete

---

**Remember**: Quality over speed. Take time to do each phase properly. Test thoroughly before moving to next phase. Refer to this TODO frequently to stay on track!
