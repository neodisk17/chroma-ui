## 📋 Phase 9: Testing
**Status**: 🔄 In Progress
**Goal**: Comprehensive test coverage (>80%) with unit, integration, and E2E tests
### Tasks Checklist
- [x] 9.1 Install testing dependencies (Vitest, Testing Library, Playwright)
- [x] 9.2 Write unit tests for utilities and stores
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
- ✅  Write tests first (TDD) or alongside code
- ✅  Aim for high coverage but focus on critical paths
- ✅  Test user behavior, not implementation details
- ✅  Use descriptive test names (it("should X when Y"))
- ✅  Mock external dependencies (ChromaDB, IPC)
- ✅  Use factories/fixtures for test data
- ✅  Test both happy path and error scenarios
- ✅  Keep tests fast (unit tests < 100ms)
- ✅  Use beforeEach/afterEach for setup/cleanup
- ✅  Run tests in CI/CD pipeline
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
- ❌  Testing implementation details instead of behavior
- ❌  Not mocking external dependencies (slow tests)
- ❌  Not testing error scenarios
- ❌  Brittle tests that break on small changes
- ❌  Not cleaning up after tests (memory leaks)
- ❌  Low coverage of critical code paths
---
