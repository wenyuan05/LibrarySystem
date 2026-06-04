# Bug Fix Log

This file documents all bug fixes applied to the project.

## 2026-06-04

### Fix 9: Correct reader borrow confirmation cancel behavior
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `backend/controllers/userController.js`
  - `backend/routes/borrowRoutes.js`
  - `src/utils/api.js`
  - `src/components/Books/BookList.jsx`
  - `src/pages/BookDetailsPage.jsx`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/components/Books/Books.css`
  - `src/components/Borrow/Borrow.css`
  - `src/pages/BookDetailsPage.css`
  - `public/打叉.svg`
  - `API_DOC.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `POST /api/borrow/cancel-borrow-lock` so readers can explicitly cancel their own pending borrow lock.
  - Changed Confirm Borrowing dialogs so `Cancel Lock` cancels the pending lock, while `Not Now` and the close icon only hide the dialog.
  - Restored confirmation countdown display and kept it tied to `confirm_deadline` after the dialog is hidden and reopened.
  - Returned `confirm_deadline` from user borrow records so My Borrow Records can restore the countdown correctly.
  - Synchronized Books page pending-borrow state from active `borrowing` records only.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `git diff --check`
  - `node -e "require('./backend/routes/userRoutes'); require('./backend/controllers/userController'); console.log('user modules ok')"`
- **Reason**: The old Cancel button only closed the dialog, and some record views lost the confirmation countdown because `confirm_deadline` was not returned by the borrow-record API.

### Fix 8: Add fine accrual feature toggle
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/borrowController.js`
  - `src/pages/SystemSettingsPage.jsx`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `fine_enabled` as an enabled-by-default system setting.
  - Added a Fines Enabled toggle to the admin System Settings page.
  - Stopped new overdue records from accruing fines when disabled.
  - Froze estimated fines for already-overdue unreturned records while disabled.
  - Kept existing actual unpaid fine payment flows unchanged.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `node -e "require('./routes/borrowRoutes'); require('./controllers/borrowController'); console.log('fine toggle modules ok')"`
- **Reason**: Admins need to pause fine accrual without blocking normal returns or payment of already-created fines.

### Fix 7: Add reservation feature toggle
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/systemController.js`
  - `backend/controllers/borrowController.js`
  - `src/pages/SystemSettingsPage.jsx`
  - `src/components/Books/BookList.jsx`
  - `src/pages/BookDetailsPage.jsx`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `reservation_enabled` as an enabled-by-default system setting.
  - Exposed `reservation_enabled` through `GET /api/system/feature-flags`.
  - Added a Reservations Enabled toggle to the admin System Settings page.
  - Blocked new reservation requests in `POST /api/borrow/reserve` when disabled.
  - Disabled reader-facing reserve controls on the Books page and Book Details page when disabled.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `node -e "require('./routes/systemRoutes'); require('./routes/borrowRoutes'); console.log('reservation toggle modules ok')"`
- **Reason**: Admins need a global switch to pause new reservations without affecting existing cancellation flows.

### Fix 6: Export book inventory with copy details
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `src/utils/api.js`
  - `src/pages/BookManagementPage.jsx`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed `GET /api/books/export` to export joined book and copy inventory data.
  - Added one CSV row per book copy, including book metadata, categories, copy code, copy status, and copy location.
  - Added robust CSV escaping and UTF-8 BOM output for spreadsheet compatibility.
  - Restored the Book Management export button for admin/librarian users.
  - Added blob response handling to the shared frontend request helper.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `node -e "require('./routes/bookRoutes'); require('./controllers/bookController'); console.log('book modules ok')"`
- **Reason**: Librarians need an inventory export that combines the book table and copy table for operational review.

### Fix 5: Validate email format when editing users
- **Files modified**:
  - `backend/controllers/userController.js`
  - `src/components/Users/EditUserForm.jsx`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added backend email format validation for `PUT /api/users/:id` whenever the request includes `email`.
  - Added frontend validation before submitting the edit user form.
  - Returned backend validation errors through the edit user toast.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `node -e "require('./routes/userRoutes'); require('./controllers/userController'); console.log('user modules ok')"`
- **Reason**: Admin user editing previously relied on browser `type="email"` validation and backend uniqueness checks, so direct API requests could save invalid email values.

### Fix 4: Add payment list filters and pagination to Income Dashboard
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `src/pages/IncomeDashboardPage.jsx`
  - `src/pages/IncomeDashboardPage.css`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added paginated `GET /api/payments` responses with `items` and `pagination`.
  - Added keyword filtering by order number, username, display name, status, and user ID.
  - Added created-date range filtering with date validation.
  - Added Dashboard controls for keyword, status, created date filters, reset, and previous/next page navigation.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd audit --omit=dev`
  - `node -e "require('./routes/paymentRoutes'); require('./controllers/paymentController'); console.log('payment modules ok')"`
- **Reason**: Income Dashboard payment records can grow beyond a single table view, so librarians need searchable, time-filtered, paginated order review.

### Fix 3: Add income trend and date-range analytics
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `backend/routes/paymentRoutes.js`
  - `src/utils/api.js`
  - `src/pages/IncomeDashboardPage.jsx`
  - `src/pages/IncomeDashboardPage.css`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `GET /api/payments/income/analytics` for admin/librarian users.
  - Returned default monthly buckets for the past year when no date range is specified.
  - Added inclusive same-day and date-range income totals.
  - Switched the chart series to the selected range when dates are provided.
  - Added automatic chart granularity: daily for up to 31 days, 7-day buckets for up to 180 days, and monthly buckets for longer ranges.
  - Added an Income Dashboard line chart, date range query form, and default past-year reset.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd audit --omit=dev`
  - `node -e "require('./routes/paymentRoutes'); require('./controllers/paymentController'); console.log('payment analytics modules ok')"`
- **Reason**: Librarians need to review yearly income trends and query exact income for arbitrary dates or time ranges from the Income Dashboard.

### Fix 2: Remove legacy direct fine settlement endpoint
- **Files modified**:
  - `backend/routes/borrowRoutes.js`
  - `backend/controllers/borrowController.js`
  - `package.json`
  - `package-lock.json`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Removed `POST /api/borrow/pay-fine` so fines can no longer be marked paid without a payment order.
  - Updated documentation and regression notes to point fine settlement through `POST /api/payments/fines/alipay`.
  - Upgraded `react-router-dom` to `7.16.0`, clearing the root frontend npm audit findings.
- **Verification**:
  - `npm.cmd audit --omit=dev`
- **Reason**: Release 3 fine payments must flow through Alipay-shaped payment orders and income records. The legacy direct settlement endpoint could bypass that business flow.

### Fix 1: Isolate authentication per browser tab
- **Files modified**:
  - `src/context/AuthContext.jsx`
  - `src/utils/api.js`
  - `src/pages/BookManagementPage.jsx`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed frontend auth storage from shared `localStorage` to per-tab `sessionStorage`.
  - Updated API token reads to use the current tab's session user.
  - Added a one-time migration from legacy `localStorage.user` to the current tab's `sessionStorage.user`.
  - Documented that different tabs can now log in as different users without overwriting each other.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
- **Reason**: Multiple browser tabs shared the same `localStorage.user`, so logging in or out in one tab changed the token used by other tabs while their UI could still show the previous account.

## 2026-05-31

### Fix 2: Pin sqlite3 to 5.1.7 for older Linux deployment
- **Files modified**:
  - `backend/package.json`
  - `backend/package-lock.json`
  - `README.md`
  - `DESIGN_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Pinned backend `sqlite3` to `5.1.7` for compatibility with Baota/older Linux deployments that do not provide glibc 2.38.
  - Removed the deployment requirement to rebuild SQLite from source, reducing the need for root access and server compiler tooling.
  - Documented the server-side recovery steps for `GLIBC_2.38 not found` errors caused by incompatible `sqlite3@6.x` prebuilt binaries.
  - Updated the design dependency table to match the current backend SQLite3 version.
- **Verification**:
  - `node -e "require('sqlite3'); console.log('sqlite3 ok')"`
  - `npm.cmd audit --omit=dev` reports known transitive vulnerabilities from the older SQLite native build toolchain.
- **Reason**: Deployments on older Linux distributions can fail when npm installs a `sqlite3@6.x` prebuilt binding built against a newer glibc. Pinning `sqlite3@5.1.7` favors Baota deployment compatibility over a clean npm audit report.

### Fix 1: Resolve React Hook dependency lint errors
- **Files modified**:
  - `src/components/Books/AddBookForm.jsx`
  - `src/components/Books/EditBookForm.jsx`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/components/Users/EditUserForm.jsx`
  - `src/components/Users/UserList.jsx`
  - `src/pages/AnnouncementsPage.jsx`
  - `src/pages/BookDetailsPage.jsx`
  - `src/pages/BookManagementPage.jsx`
  - `src/pages/CategoryManagementPage.jsx`
  - `src/pages/IncomeDashboardPage.jsx`
  - `src/pages/LogsPage.jsx`
  - `src/pages/ProfilePage.jsx`
  - `src/pages/ReservationsPage.jsx`
  - `src/pages/ReturnApprovalPage.jsx`
  - `src/pages/StatsPage.jsx`
- **Changes**:
  - Wrapped shared async loader functions in `useCallback` and wired effects to depend on the stabilized callbacks.
  - Stabilized modal close handlers used by keyboard and outside-click listeners.
  - Memoized Add Book batch preview subsets so dependent effects do not rerun because of new array references on every render.
  - Moved Book Details data loading ahead of effects so countdown refresh and initial loading use the same stable callback.
- **Verification**:
  - `npm.cmd run lint`
  - `npm.cmd run build`
- **Reason**: React Hook dependency warnings made the lint output noisy and could hide real regressions. Stabilizing these callbacks keeps effects explicit and prevents accidental stale closures.

## 2026-05-13

### Fix 6: Allow fine payment before return approval
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `API_DOC.md`
  - `DESIGN_DOC.md`
  - `README.md`
  - `TEST_CASES.md`
- **Changes**:
  - Return submission now posts newly calculated overdue fines to `users.total_fine` immediately.
  - Fine payment now totals unpaid `borrow_records` directly instead of relying only on the cached user total.
  - Return approval no longer adds the same fine again, preventing duplicate balances.
  - Borrow blocking now checks unpaid fine records directly so old cache drift does not let users bypass unpaid fines.
- **Reason**: Users could see an unpaid fine after submitting a return, but payment failed until a librarian approved the return because the cached user fine balance was not updated yet.

### Fix 5: Add Books page search button
- **Files modified**:
  - `src/pages/BooksPage.jsx`
  - `src/components/Books/Books.css`
  - `README.md`
  - `RELEASE2_NOTES.md`
  - `TEST_CASES.md`
- **Changes**:
  - Added the shared icon search button to the Books page search bar.
  - Added a dedicated click handler that reruns the book search with the current search term.
  - Scoped the Books page search button size so it stays aligned with the search input.
  - Documented the UI behavior and regression test coverage.
- **Reason**: The Books page search bar only exposed a text input, while other search bars also provided a visible search button.

### Fix 4: Correct Books page Reserved filter
- **Files modified**:
  - `src/pages/BooksPage.jsx`
  - `src/components/Books/BookList.jsx`
- **Changes**:
  - Books page now loads the current user's reservation records with `borrowAPI.getReservations`.
  - The `Reserved` quick filter now matches books by reservation `book_id` instead of relying on a non-existent `book.status === 'reserved'` field.
  - Active reservation matching accepts both `active` and `pending` states.
  - BookList notifies the parent Books page after reserve/cancel actions so the Reserved filter updates without a full page refresh.
- **Reason**: Reserved books were not shown in the Books page Reserved category even when the user already had active reservations.

### Fix 1: Harden dangerous delete operations
- **Files modified**:
  - `backend/controllers/userController.js`
  - `backend/controllers/bookController.js`
  - `backend/controllers/borrowController.js`
  - `backend/controllers/logController.js`
  - `backend/routes/userRoutes.js`
  - `backend/utils/statusConstants.js`
  - `src/components/Users/UserList.jsx`
  - `src/components/Books/BookList.jsx`
- **Changes**:
  - Added shared active-status constants for borrow, reservation, and occupied-copy checks.
  - User deletion now blocks self-deletion, admin-account deletion, active borrow records, and active reservations.
  - Book deletion now blocks active borrow records, occupied copies, and active reservations.
  - Active borrow checks now include `borrowing`, `borrowed`, `overdue`, and `returning`.
  - Removed reliance on `return_date IS NULL` for delete safety, because `returning` records can already have a `return_date` while still awaiting approval.
  - Reduced-copy updates now require enough available copies and validate `total_copies` as a positive integer.
  - Log clearing validates `days` before running the delete query.
  - Frontend delete failures now surface backend safety messages.
- **Reason**: Prevent low-level data integrity failures such as deleting a user or book while unreturned, overdue, or return-pending records still exist.

### Fix 2: Add safe single-copy deletion
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `backend/routes/bookRoutes.js`
  - `src/utils/api.js`
  - `src/components/Books/CopyManagementModal.jsx`
- **Changes**:
  - Added `DELETE /api/books/copies/:id`.
  - Copy deletion is limited to `admin` and `librarian`.
  - Backend only deletes copies with `status = 'available'`.
  - Backend blocks deleting the last remaining copy of a book.
  - Backend blocks deletion if the copy has any active borrow record.
  - After deletion, `books.total_copies` and `books.available_copies` are recalculated in the same transaction.
  - Copy Management modal now shows a `Delete` action per copy with confirmation and disabled states.
- **Reason**: Let librarians remove surplus physical copies while preserving borrow, reservation, and inventory consistency.

### Fix 3: Fix Copy Management action-column layout
- **Files modified**:
  - `src/components/Books/Books.css`
- **Changes**:
  - Removed desktop table minimum width that forced horizontal scrolling.
  - Changed copy-management table columns to fit the modal width.
  - Constrained barcode rendering and compacted the location editor.
  - Kept horizontal scrolling only for smaller screens.
- **Reason**: Ensure `Confirm` and `Delete` buttons are visible without dragging the bottom scrollbar on desktop.

## 2026-03-08

### Fix 1: Add security checks for books.find()
- **Files modified**: `src/components/Books/BookList.jsx`
- **Changes**: Added security checks in `handleUpdateStatus`, `handleBorrowBook`, and `handleReturnBook` functions to ensure `books.find()` returns a valid book object before spreading it.
- **Reason**: Prevent `{...undefined, status}` error when book is not found.

### Fix 2: Reset registerData on mode toggle
- **Files modified**: `src/components/Login/Login.jsx`
- **Changes**: Added code to reset `registerData` state when toggling between login and register modes.
- **Reason**: Improve user experience by clearing form data when switching modes.

### Fix 3: Add book_id to borrow records
- **Files modified**: `backend/server.js`
- **Changes**: Modified SQL query in `/api/users/:id/borrow-records` route to include `br.book_id` field.
- **Reason**: Ensure frontend has access to book_id for proper filtering and display of Return buttons.

### Fix 4: Remove unused state and improve error handling
- **Files modified**: `src/components/Books/BookList.jsx`
- **Changes**: 
  - Removed unused `editingBook` state
  - Changed error handling to use `setError(null)` instead of `window.location.reload()`
- **Reason**: Fix lint error and provide a more gentle error recovery mechanism.

### Fix 5: Remove unused user check in MainLayout
- **Files modified**: `src/App.jsx`
- **Changes**: Removed the `if (!user)` check in MainLayout component
- **Reason**: ProtectedRoute already ensures only authenticated users can access, so null user shouldn't happen

### Fix 6: Improve JWT secret handling
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Added warning when JWT_SECRET environment variable is not set
  - Updated all JWT operations to use process.env.JWT_SECRET
  - Added security note about using environment variables in production
- **Reason**: Enhance security by encouraging proper JWT secret management in production

### Fix 7: Improve CORS configuration
- **Files modified**: `backend/server.js`
- **Changes**: Updated CORS configuration to use specific origin and allowed methods
- **Reason**: Enhance security by restricting CORS to specific origins

### Fix 8: Use async bcrypt hashing
- **Files modified**: `backend/db.js`
- **Changes**: Changed bcrypt.hashSync to bcrypt.hash in the password migration loop
- **Reason**: Prevent blocking the event loop with synchronous hashing

### Fix 9: Improve transaction handling
- **Files modified**: `backend/server.js`
- **Changes**: Added proper BEGIN TRANSACTION and ROLLBACK/COMMIT statements to borrow and return routes
- **Reason**: Ensure data consistency and handle errors properly during transactions

### Fix 10: Add aria-label to toast close button
- **Files modified**: `src/components/Toast/Toast.jsx`
- **Changes**: Added aria-label="Close toast" to the close button
- **Reason**: Improve accessibility for screen readers

### Fix 11: Implement book update functionality
- **Files modified**: 
  - `backend/server.js`
  - `src/utils/api.js`
  - `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Updated backend `/api/books/:id` route to support updating all book fields
  - Added booksAPI.update method
  - Modified EditBookForm to call the actual API instead of using mock data
- **Reason**: Make EditBookForm functional and persist changes

### Fix 12: Improve user API access control
- **Files modified**: `backend/server.js`
- **Changes**: Added access control to `/api/users/:id` route to only allow users to view their own information or admins to view all
- **Reason**: Enhance security and protect user privacy

### Fix 13: Extract environment variables
- **Files modified**: 
  - `.env`
  - `backend/.env`
  - `backend/package.json`
  - `backend/server.js`
  - `src/utils/api.js`
- **Changes**: 
  - Created .env files for both frontend and backend
  - Added dotenv dependency to backend
  - Modified api.js to use VITE_API_BASE_URL environment variable
  - Updated server.js to load environment variables and use them for JWT_SECRET and CORS configuration
- **Reason**: Improve configurability and security by using environment variables instead of hardcoding values

### Fix 14: Fix CORS and public book access
- **Files modified**: 
  - `backend/.env`
  - `backend/server.js`
- **Changes**: 
  - Updated FRONTEND_URL in backend/.env to http://localhost:5173
  - Removed authenticateToken middleware from /api/books and /api/books/:id routes
  - Made book listings publicly accessible without authentication
- **Reason**: Fix CORS error and allow users to browse books without logging in

### Fix 15: Implement unified error handling
- **Files modified**: 
  - `backend/server.js`
  - `src/hooks/useApiRequest.jsx`
- **Changes**: 
  - Added unified error handling middleware in backend to catch and format all errors
  - Created useApiRequest custom hook for frontend to handle API requests with loading states and error messages
  - Added error logging with stack traces in backend for better debugging
- **Reason**: Improve error handling consistency and reduce code duplication

## 2026-03-08

### Fix 16: Optimize user interface and permission control
- **Files modified**: 
  - `src/App.jsx`
  - `src/components/Login/Login.css`
  - `src/components/ProtectedRoute.jsx`
  - `src/components/Sidebar/Sidebar.jsx`
  - `src/components/Users/UserList.jsx`
  - `src/components/Users/Users.css`
  - `src/index.css`
  - `README.md`
- **Changes**: 
  - Optimized App.jsx route configuration, added user role requirement for /books path
  - Improved Login.css styles, enhanced login form layout
  - Enhanced ProtectedRoute.jsx permission control, implemented admin redirection
  - Improved Sidebar.jsx navigation logic, displayed different menus based on user role
  - Optimized UserList.jsx, added search functionality and deletion confirmation
  - Improved Users.css styles, added responsive design
  - Optimized index.css layout styles
  - Updated README.md documentation, added new feature descriptions
- **Reason**: Enhance user experience, improve permission control, and optimize interface design

## 2026-03-09

### Fix 17: Add request validation for admin add user
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Created `validateAdminAddUserBody` middleware for POST /api/users route
  - Added validation for all required fields (username, password, role, name, email)
  - Added length validation for username, password, and name
  - Added email format validation
  - Added strict role validation (only 'user' or 'admin' allowed)
  - Updated POST /api/users route to use the new validation middleware
- **Reason**: Prevent creation of invalid users and return consistent 400 responses

### Fix 18: Update documentation
- **Files modified**: `README.md`
- **Changes**: 
  - Updated security section to include strict role validation
  - Updated backend development guide to include role validation
- **Reason**: Keep documentation in sync with code changes

### Fix 19: Fix toast stacking and animation
- **Files modified**: 
  - `src/context/ToastContext.jsx`
  - `src/components/Toast/Toast.jsx`
  - `src/components/Toast/Toast.css`
- **Changes**: 
  - Added toast-container to handle multiple toasts
  - Updated toast styles to use relative positioning
  - Added closing animation for toasts
  - Ensured toasts stack and animate independently
- **Reason**: Fix multiple toasts overlapping and ensure smooth animations

### Fix 20: Consolidate card styles
- **Files modified**: `src/styles/global.css`
- **Changes**: 
  - Removed duplicate .card and .card:hover definitions
  - Consolidated into a single .card definition with consistent styling
  - Retained max-width: 1000px and centering behavior
- **Reason**: Avoid unintentional style overrides and make layout changes predictable

### Fix 21: Secure environment variables
- **Files modified**: 
  - `.env`
  - `backend/.env`
  - `.gitignore`
  - `.env.example`
  - `backend/.env.example`
  - `README.md`
- **Changes**: 
  - Created `.env.example` files for both root and backend directories
  - Updated `.gitignore` to exclude all .env files
  - Rotated JWT_SECRET to a new value
  - Updated README.md with detailed environment variable configuration instructions
  - Added security notes about JWT_SECRET management
- **Reason**: Prevent secrets from being committed to version control and improve security practices

### Fix 22: Fix undefined CSS variable
- **Files modified**: 
  - `src/components/Users/Users.css`
- **Changes**: 
  - Replaced undefined `--font-size-base` variable with existing `--font-size-md` variable
- **Reason**: Ensure CSS variables are properly defined and avoid fallback to browser defaults

### Fix 23: Add null/undefined guard for user search
- **Files modified**: 
  - `src/components/Users/UserList.jsx`
- **Changes**: 
  - Added null/undefined guards for username, name, and email fields before calling toLowerCase()
  - Used (value || '') pattern to default to empty string for missing fields
- **Reason**: Prevent search functionality from crashing on incomplete user records with null/undefined fields

### Fix 24: Remove duplicate CSS definitions
- **Files modified**: 
  - `src/styles/global.css`
- **Changes**: 
  - Removed duplicate .search-bar, .action-bar, and .form-actions definitions
  - Retained the centered versions with max-width constraints
  - Added responsive media query for .action-bar
- **Reason**: Eliminate CSS-order-dependent behavior and maintain a single source of truth for shared layout classes

### Fix 25: Add ISBN unique index
- **Files modified**: 
  - `backend/db.js`
- **Changes**: 
  - Added CREATE UNIQUE INDEX IF NOT EXISTS for books(isbn)
  - Ensures ISBN uniqueness even on already-created databases
- **Reason**: Enforce ISBN uniqueness across all database instances, including existing ones

### Fix 26: Add Node.js version requirement
- **Files modified**: 
  - `package.json`
- **Changes**: 
  - Added engines field specifying node >= 20.0.0
- **Reason**: Ensure compatibility with react-router-dom@7.13.1 which requires Node.js >= 20

### Fix 27: Add error handling for fetchBooks
- **Files modified**: 
  - `src/App.jsx`
- **Changes**: 
  - Added error state management for BooksPage and BookManagementPage
  - Added toast notifications for error messages
  - Added error UI with retry button
- **Reason**: Provide user-friendly error feedback when book loading fails, instead of just logging to console

### Fix 28: Remove backend/.env from version control and rotate JWT secret
- **Files modified**: 
  - `backend/.env` (removed from git)
- **Changes**: 
  - Removed backend/.env from version control using git rm --cached
  - Rotated JWT_SECRET to a new value
  - Ensured only backend/.env.example remains in git
- **Reason**: Prevent secrets from being committed to version control and improve security

### Fix 29: Fix README.md API authentication documentation
- **Files modified**: 
  - `README.md`
- **Changes**: 
  - Moved `/api/register` from the authenticated endpoints list to the public endpoints list
- **Reason**: Correct documentation to reflect that the register endpoint is public and doesn't require an Authorization header

### Fix 30: Fix Toast.jsx animationEndTimer cleanup
- **Files modified**: 
  - `src/components/toast/Toast.jsx`
- **Changes**: 
  - Added refs to store timeout IDs
  - Updated cleanup function to clear all timers
  - Fixed ineffective cleanup of animationEndTimer
- **Reason**: Prevent calling onClose after component unmount and avoid memory leaks

### Fix 31: Fix toast ID generation to prevent collisions
- **Files modified**: 
  - `src/context/ToastContext.jsx`
- **Changes**: 
  - Replaced Date.now() with crypto.randomUUID() for toast IDs
- **Reason**: Prevent ID collisions when multiple toasts are created within the same millisecond

### Fix 32: Scope Users.css styles to avoid global conflicts
- **Files modified**: 
  - `src/components/Users/Users.css`
- **Changes**: 
  - Scoped .action-bar, .search-bar, and .search-input selectors under .user-list
- **Reason**: Prevent CSS class name collisions with global styles and avoid order-dependent behavior

### Fix 33: Fix BookList.jsx error button text
- **Files modified**: 
  - `src/components/books/BookList.jsx`
- **Changes**: 
  - Changed error state button text from "Retry" to "Dismiss"
- **Reason**: The button only clears the error state, not retry any action, so the text should accurately reflect its function

### Fix 34: Use book_id for returning books in BorrowRecords
- **Files modified**: 
  - `src/components/borrow/BorrowRecords.jsx`
- **Changes**: 
  - Updated handleReturnBook to use record.book_id directly
  - Removed unnecessary books state and fetchBooks call
  - Added validation for book_id presence
- **Reason**: Prevent returning the wrong book when titles are not unique, and simplify the component

### Fix 35: Add validation for PUT /api/books/:id
- **Files modified**: 
  - `backend/server.js`
- **Changes**: 
  - Added validateBookUpdateBody middleware
  - Added validation for title, author, isbn, and status fields
  - Added status whitelist validation (only "available" or "borrowed")
  - Added type and length validation for all fields
- **Reason**: Prevent invalid data from being submitted and provide clear 400 error responses

### Fix 36: Fix body layout in index.css
- **Files modified**: 
  - `src/index.css`
- **Changes**: 
  - Removed display:flex, place-items, and justify-content from body
- **Reason**: Allow #root to stretch to viewport and prevent layout/scroll issues with the full-screen app layout

### Fix 37: Fix useToast usage in App.jsx
- **Files modified**: 
  - `src/App.jsx`
- **Changes**: 
  - Replaced `addToast` with `showToast` in BooksPage and BookManagementPage components
  - Updated function call signature from `addToast({ message, type })` to `showToast(message, type)`
- **Reason**: Fix runtime error caused by using the wrong function name and signature for toast notifications

### Fix 38: Fix search bar styles
- **Files modified**: 
  - `src/styles/global.css`
- **Changes**: 
  - Added global `.search-input` styles with proper background color, border, and focus effects
  - Ensured search input uses `--bg-secondary` for background and `--text-primary` for text
  - Added consistent padding, border radius, and transition effects
- **Reason**: Fix search bar appearing with black background and inconsistent styling across pages

### Fix 39: Remove unused AddUserForm import
- **Files modified**: 
  - `src/App.jsx`
- **Changes**: 
  - Removed unused `AddUserForm` import
- **Reason**: Fix no-unused-vars linting error and clean up unused imports

### Fix 40: Remove .env from version control and rotate JWT_SECRET
- **Files modified**: 
  - `.env` (removed from git)
  - `backend/.env`
- **Changes**: 
  - Removed `.env` from version control using git rm --cached
  - Rotated JWT_SECRET to a new secure value
  - Updated both root and backend .env files with the new secret
- **Reason**: Prevent secrets from being committed to version control and improve security

### Fix 41: Convert EditBookForm to modal popup
- **Files modified**: 
  - `src/components/Books/Books.css`
  - `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Added modal styles to Books.css including overlay, content, and animations
  - Modified EditBookForm.jsx to use modal structure
  - Added modal header with close button
  - Updated event handling for modal closing
  - Ensured form functionality remains unchanged
- **Reason**: Improve user experience by displaying edit form as a popup instead of inline, maintaining consistent styling with the rest of the application

### Fix 42: Add admin user borrow records management
- **Files modified**: 
  - `src/components/Users/UserList.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/App.jsx`
- **Changes**: 
  - Added "Borrow Records" button to each user in UserList
  - Created UserBorrowRecords component to display user-specific borrow records
  - Added new route `/user-borrow-records/:userId` for admin access
  - Implemented return functionality for admin to manage borrow status
  - Ensured only admins can access user borrow records
- **Reason**: Allow administrators to view and manage user borrow records, including manually returning books

### Fix 43: Add back button to user borrow records page
- **Files modified**: `src/components/Borrow/UserBorrowRecords.jsx`
- **Changes**: 
  - Added useNavigate hook for navigation
  - Added "Back to Users" button at the top of the page
  - Implemented handleBackToUsers function to navigate back to user list
- **Reason**: Improve user experience by providing an easy way for administrators to return to the user list page

### Fix 44: Fix animation name conflict in Books.css
- **Files modified**: `src/components/books/Books.css`
- **Changes**: 
  - Renamed `fadeIn` animation to `booksModalFadeIn`
  - Renamed `slideIn` animation to `booksModalSlideIn`
  - Updated all references to these animations in the file
- **Reason**: Avoid conflicts with globally defined animations in global.css, ensuring animations don't override each other across the application

### Fix 45: Improve modal accessibility in EditBookForm
- **Files modified**: `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Added `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"` attributes to modal
  - Added keyboard handling for Escape key to close modal
  - Added focus management to automatically focus on title input when modal opens
  - Updated `aria-label` for close button to be more descriptive
  - Added proper focus trapping and cleanup
- **Reason**: Improve accessibility for keyboard users and screen readers, making the modal more usable for all users

### Fix 46: Fix stale state in UserBorrowRecords
- **Files modified**: `src/components/Borrow/UserBorrowRecords.jsx`
- **Changes**: 
  - Changed `setRecords(records.map(...))` to use functional state update `setRecords(prevRecords => prevRecords.map(...))`
- **Reason**: Avoid stale state issues when multiple updates happen close together, ensuring the update always applies to the latest state

### Fix 47: Improve error handling in UserBorrowRecords
- **Files modified**: `src/components/Borrow/UserBorrowRecords.jsx`
- **Changes**: 
  - Removed `setError('Failed to return book')` from return-book error path
  - Kept only `showToast(err.message, 'error')` for action-level failures
- **Reason**: Prevent the entire page from switching to error UI when a single return action fails, keeping the records list visible and only showing error via toast

## 2026-03-10

### Fix 48: Implement book detail page and database refactoring
- **Files modified**: 
  - `backend/db.js`
  - `backend/server.js`
  - `src/App.jsx`
  - `src/components/Books/AddBookForm.jsx`
  - `src/components/Books/BookDetail.jsx`
  - `src/components/Books/BookList.jsx`
  - `src/components/Books/Books.css`
  - `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Added new fields to books table: publisher, publication_date, description, total_copies, available_copies
  - Updated database initialization with sample data
  - Modified borrow and return functionality to use available_copies field
  - Created BookDetail component for book detail page
  - Updated BookList component to support click-to-detail functionality
  - Modified AddBookForm and EditBookForm to support new fields
  - Added corresponding styles for new components and fields
- **Reason**: Enhance book information display and improve borrowing functionality

### Fix 49: Fix import error in BookList.jsx
- **Files modified**: `src/components/Books/BookList.jsx`
- **Changes**: 
  - Changed import statement to import motion from framer-motion instead of react-router-dom
- **Reason**: Fix SyntaxError caused by incorrect import path

### Fix 51: Allow admins to access book detail page
- **Files modified**: 
  - `src/App.jsx`
  - `src/components/books/BookList.jsx`
- **Changes**: 
  - Updated /books/:id route in App.jsx to remove user-only restriction
  - Reverted BookList changes to allow all roles to click on cards
  - Ensured cursor style always shows pointer for all roles
- **Reason**: Allow admins to access book detail page for better management capabilities

### Fix 52: Add cross-field validation for book copies
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Updated validateBookBody middleware to ensure available_copies <= total_copies when adding new books
  - Updated validateBookUpdateBody middleware to ensure available_copies <= total_copies when both are provided
  - Enhanced book update handler to load current values from DB and validate when only one of total_copies or available_copies is updated
  - Added validation to prevent reducing total_copies below the number of borrowed books
- **Reason**: Ensure book inventory consistency and prevent invalid states

### Fix 53: Fix number input handling in book forms
- **Files modified**: 
  - `src/components/Books/AddBookForm.jsx`
  - `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Updated handleChange functions to convert number input values to integers
  - Added validation for available_copies <= total_copies in both forms
  - Ensured proper type handling when submitting form data to the API
- **Reason**: Fix 400 errors caused by string values being sent to the backend for number fields

### Fix 54: Fix CSS styling conflicts for book actions
- **Files modified**: `src/components/books/Books.css`
- **Changes**: 
  - Scoped book card actions to .book-card .book-actions
  - Scoped book detail actions to .book-detail-section .book-actions
  - Updated responsive styles to maintain proper scoping
- **Reason**: Prevent styling conflicts between book list and detail page actions

### Fix 55: Fix book list button logic for multiple copies
- **Files modified**: `src/components/books/BookList.jsx`
- **Changes**: 
  - Updated render logic to show Return button whenever user has an active borrow record
  - Updated render logic to show Borrow button when available_copies > 0
  - Now both buttons can be displayed simultaneously for books with multiple copies
- **Reason**: Allow users to return borrowed books even when copies are still available

### Fix 56: Fix numeric field validation in backend
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Updated validateBookBody to use !== undefined checks for numeric fields
  - Added string-to-number coercion for numeric fields
  - Updated validateBookUpdateBody with the same fixes
  - Added numeric conversion in book update handler
  - Ensured proper validation of 0 values
- **Reason**: Fix validation issues with numeric fields, especially when values are 0 or come as strings from HTML inputs

### Fix 57: Fix concurrent borrow issue
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Updated borrow flow to add conditional update for available_copies
  - Added WHERE clause to ensure only available books are borrowed
  - Added check for affected rows to handle concurrent borrows
  - Updated return flow to check for affected rows
  - Ensured proper rollback when no rows are affected
- **Reason**: Prevent available_copies from going negative during concurrent borrow operations

### Fix 58: Fix EditBookForm numeric field initialization
- **Files modified**: `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Updated useEffect initialization to parse total_copies and available_copies as integers
  - Ensured numeric fields are properly converted from strings to numbers when initializing form data
  - Maintained consistency with AddBookForm's number handling
- **Reason**: Fix 400 errors caused by string values being sent to the backend for number fields when editing books

### Fix 59: Fix const variable reassignment in backend validation
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Updated validateBookBody to use separate local variables for numeric coercion
  - Updated validateBookUpdateBody to use separate local variables for numeric coercion
  - Updated book update handler to use separate local variables for numeric coercion
  - Renamed request body variables to avoid const reassignment
- **Reason**: Fix runtime errors caused by trying to reassign const variables during numeric coercion

### Fix 60: Add crypto.randomUUID fallback mechanism
- **Files modified**: `src/context/ToastContext.jsx`
- **Changes**: 
  - Added feature detection for crypto.randomUUID availability
  - Implemented fallback using Date.now().toString(36) + Math.random().toString(36).substr(2)
  - Ensured toast ID generation works in all environments
- **Reason**: Fix "crypto.randomUUID is not a function" error when deploying to servers that don't support this API

### Fix 61: Fix publication_date empty string validation
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Updated validateBookUpdateBody to allow empty strings for publication_date
  - Modified book update handler to skip updating publication_date when value is empty string
  - Updated both update branches to handle empty publication_date properly
- **Reason**: Fix 400 errors when updating books with empty publication_date from frontend date inputs

### Fix 62: Fix EditBookForm parseInt handling for 0 values
- **Files modified**: `src/components/Books/EditBookForm.jsx`
- **Changes**: 
  - Updated parseInt logic to use isNaN check instead of logical OR
  - Ensured legitimate 0 values are preserved instead of being converted to 1
  - Improved number parsing reliability
- **Reason**: Fix incorrect conversion of 0 values to 1 when initializing form data

### Fix 63: Fix optional fields validation for empty strings
- **Files modified**: `backend/server.js`
- **Changes**: 
  - Updated validateBookUpdateBody to allow empty strings for publisher and description fields
  - Modified book update handler to skip updating publisher and description when values are empty strings
  - Updated both update branches to handle empty optional fields properly
- **Reason**: Fix 400 errors when editing books with empty optional fields from frontend forms

## 2026-03-13

### Fix 64: Configure cloud deployment settings
- **Files modified**: 
  - `backend/.env`
  - `backend/server.js`
  - `.env`
- **Changes**: 
  - Updated backend CORS configuration to support wildcard origin
  - Modified frontend API base URL to use relative path `/api`
  - Updated backend FRONTEND_URL to use wildcard `*`
  - Added logic to handle credentials properly when using wildcard origin
- **Reason**: Enable cloud deployment with domain access by using relative paths instead of hardcoded URLs

### Fix 65: Update website name and add footer information
- **Files modified**: 
  - `index.html`
  - `src/App.jsx`
  - `src/components/Login/Login.jsx`
  - `src/styles/global.css`
  - `src/components/Login/Login.css`
- **Changes**: 
  - Changed website title from "librarysystem" to "个人项目展示"
  - Updated header title in App.jsx from "Library Management System" to "个人项目展示"
  - Updated login page title from "Library Management System" to "个人项目展示"
  - Added footer section to both main layout and login page
  - Added copyright and ICP record information to footers
  - Added corresponding CSS styles for footers
- **Reason**: Update website branding and comply with Chinese website requirements for ICP records

### Fix 66: Separate privacy information into dedicated file
- **Files modified**: 
  - `src/config/privacy.js`
  - `src/App.jsx`
  - `src/components/Login/Login.jsx`
  - `.gitignore`
- **Changes**: 
  - Created `src/config/privacy.js` to store sensitive privacy information
  - Updated App.jsx and Login.jsx to import and use privacyConfig
  - Added `src/config/privacy.js` to .gitignore
  - Moved ICP record and copyright information to privacy.js
- **Reason**: Protect sensitive privacy information by keeping it out of version control while maintaining easy access for the application

## 2026-03-21

### Fix 67: Prevent multiple responses in getBorrowStats
- **Files modified**: `backend/controllers/statsController.js`
- **Changes**: 
  - Added `done` variable to track if a response has already been sent
  - Added guard clauses in each `db.get` callback to check if `done` is true
  - Set `done = true` before sending any response (error or success)
  - Added guard clause in `checkCompletion` function to prevent duplicate responses
- **Reason**: Fix "Cannot set headers after they are sent" error by ensuring only one response is sent per request, even when multiple async queries are in flight

### Fix 68: Fix unused useEffect import in Login.jsx
- **Files modified**: `src/components/login/Login.jsx`
- **Changes**: 
  - Changed `React.useEffect` to `useEffect` to use the imported version
  - Ensured consistent use of imported hooks throughout the component
- **Reason**: Fix unused import warning and maintain consistent coding style

### Fix 69: Add type="button" to dropdown buttons in AddBookForm
- **Files modified**: `src/components/Books/AddBookForm.jsx`
- **Changes**: 
  - Added `type="button"` to the category dropdown toggle button
  - Added `type="button"` to all category option buttons in the dropdown
- **Reason**: Prevent unintended form submission when clicking category options, as buttons inside forms default to type="submit"

### Fix 70: Remove non-existent column filters from getSystemLogs
- **Files modified**: `backend/controllers/logController.js`
- **Changes**: 
  - Removed `level` and `module` parameters from query destructuring
  - Removed SQL filters for non-existent `level` and `module` columns
  - Simplified SQL queries to only use existing columns in system_logs table
- **Reason**: Fix SQL errors caused by referencing non-existent columns, ensuring the API endpoint works correctly

### Fix 71: Remove unused 'status' field from book update
- **Files modified**: 
  - `backend/controllers/bookController.js`
  - `backend/middleware/validation.js`
- **Changes**: 
  - Removed `status` parameter from destructuring in updateBook function
  - Removed `status` validation from validateBookUpdateBody middleware
- **Reason**: Fix misleading API behavior where status field was accepted but not applied, since books table doesn't have a status column (status is managed at the copy level)

### Fix 72: Fix available_copies calculation in book update
- **Files modified**: `backend/controllers/bookController.js`
- **Changes**: 
  - Removed unconditional setting of available_copies = total_copies
  - Added logic to recompute available_copies by counting actual available copies in book_copies table
  - Updated available_copies after adding or removing book copies
- **Reason**: Fix incorrect available_copies value when updating total_copies, ensuring it reflects the actual number of available copies

### Fix 73: Add validation for password reset endpoints
- **Files modified**: 
  - `backend/middleware/validation.js`
  - `backend/routes/userRoutes.js`
- **Changes**: 
  - Added `validatePasswordResetRequest` middleware for /reset-password/request endpoint
  - Added `validatePasswordReset` middleware for /reset-password endpoint
  - Added validation for required fields, email format, and password strength
  - Updated userRoutes to use the new validation middleware
- **Reason**: Enhance security and user experience by validating password reset requests, ensuring the backend enforces the same constraints as the frontend

### Fix 74: Fix search button handler in BooksPage
- **Files modified**: `src/pages/BooksPage.jsx`
- **Changes**: 
  - Renamed `handleSearch` to `handleSearchChange` for input onChange event
  - Created new `handleSearchClick` function for search button onClick event
  - Updated JSX to use the correct handlers
- **Reason**: Fix error when clicking search button, where e.target.value was undefined because the event target was the button itself

### Fix 75: Prevent multiple responses in updateSystemSettings
- **Files modified**: `backend/controllers/systemController.js`
- **Changes**: 
  - Added `hasFailed` flag to track if an error has occurred
  - Added guard clauses in all callback functions to check if `hasFailed` is true
  - Set `hasFailed = true` before sending any error response
  - Ensured only one response is sent per request
- **Reason**: Fix "Cannot set headers after they are sent" error by ensuring only one response is sent per request, even when multiple async updates are in flight

### Fix 76: Fix countdown calculation in BookDetailsPage
- **Files modified**: `src/pages/BookDetailsPage.jsx`
- **Changes**: 
  - Changed countdown calculation from hard-coded 60 minutes to using `confirm_deadline` from API response
  - Added logic to calculate time difference between current time and deadline
  - Added fallback to 60 minutes if `confirm_deadline` is not provided
- **Reason**: Ensure UI countdown matches backend's borrow confirmation time limit, which uses the `borrow_confirm_minutes` system setting

### Fix 77: Fix SQLite migration script for foreign key constraint
- **Files modified**: `backend/migrate_database.js`
- **Changes**: 
  - Removed unsupported `ALTER TABLE ... ADD FOREIGN KEY` statement
  - Added comment explaining that SQLite doesn't support adding foreign keys via ALTER TABLE
  - Added note that foreign key constraints will be handled at the application level
- **Reason**: Fix migration failure caused by SQLite's lack of support for adding foreign key constraints through ALTER TABLE statements

### Fix 78: Fix user edit modal position
- **Files modified**: `src/components/Users/Users.css`
- **Changes**: 
  - Added `min-height: 100vh;` to `.modal-overlay` to ensure full viewport height
  - Added `box-sizing: border-box;` to ensure proper box model calculation
- **Reason**: Fix user edit modal appearing too high on the screen, ensuring it's properly centered vertically

### Feature: Implement book renewal functionality
- **Files modified**: 
  - `backend/migrate_database.js`
  - `backend/controllers/borrowController.js`
  - `src/pages/SystemSettingsPage.jsx`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/components/Borrow/Borrow.css`
- **Changes**: 
  - Added `max_renew_times` and `renew_days` system settings
  - Added `renew_count` field to borrow_records table
  - Updated renewBook controller to check renewal limit and use system settings
  - Added renewal settings to SystemSettingsPage
  - Added Renew button to BorrowRecords component
  - Added handleRenewBook function to process renewal requests
  - Added CSS styles for action buttons
  - Changed Renew button color from black to primary color for better visibility
  - Modified BorrowRecords table to replace Author column with Due Date column
  - Modified UserBorrowRecords table to replace Author column with Due Date column
- **Reason**: Implement book renewal functionality with configurable limits, allowing users to renew borrowed books within system-defined limits, and improve user experience by showing due dates instead of author information in both user and admin views

### Feature: Implement overdue book tracking and notification
- **Files modified**: 
  - `backend/controllers/borrowController.js`
  - `backend/controllers/userController.js`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/components/Borrow/Borrow.css`
- **Changes**: 
  - Added `checkOverdueRecords` function in borrowController to identify and update overdue records
  - Modified `getUserBorrowRecords` function to automatically check and update overdue status
  - Added overdue count calculation in user borrow records API
  - Updated BorrowRecords component to display overdue status and count
  - Added overdue notification when entering borrow records page
  - Updated UserBorrowRecords component to display user overdue count
  - Modified unblockUser function to clear overdue status when unblocking users
  - Added CSS styles for overdue status and count display
- **Reason**: Implement comprehensive overdue book tracking, including automatic status updates, user notifications, and admin visibility, ensuring timely book returns and proper management of overdue items

## 2026-05-06

### Fix 79: Align reader and librarian borrow record layouts
- **Files modified**:
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/components/Borrow/Borrow.css`
- **Changes**:
  - Unified the reader and librarian borrow record table layout.
  - Added consistent barcode, status badge, fine, action, pagination, and sort controls.
  - Expanded normal desktop width while keeping horizontal scrolling for small screens.
- **Reason**: Keep historical borrow records readable and consistent across user roles.

### Fix 80: Preserve fine history after payment
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/pages/ProfilePage.jsx`
- **Changes**:
  - Updated fine queries to return paid and unpaid historical fine records.
  - Kept unpaid fines prioritized and calculated payable total from unpaid records only.
  - Fixed the View Fines modal data flow so borrow records can display the fine list.
- **Reason**: Prevent paid fines from disappearing from history while keeping payment totals accurate.

### Fix 81: Correct borrow confirmation copy binding
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `src/pages/BookDetailsPage.jsx`
  - `src/components/Borrow/BorrowRecords.jsx`
- **Changes**:
  - Changed pending borrow records to avoid binding or displaying a copy before confirmation.
  - Added copy selection in the confirm dialog for borrow records.
  - Fixed validation so selecting a different available copy in the confirm dialog is accepted.
- **Reason**: Avoid incorrect preselected barcodes and prevent false "copy unavailable" errors.

### Fix 82: Split book metadata management from copy management
- **Files modified**:
  - `src/pages/BookManagementPage.jsx`
  - `src/components/Books/BookList.jsx`
  - `src/components/Books/Books.css`
  - `backend/controllers/bookController.js`
- **Changes**:
  - Added a dedicated Manage Copies modal separate from Edit Info.
  - Added independent copy id, barcode, status, and location editing.
  - Added automatic copy code generation with default `Main Shelf` location.
  - Added per-copy location confirmation and bulk location update.
- **Reason**: Separate book metadata from physical inventory copies and make copy-level operations explicit.

### Fix 83: Modernize book dashboard and Add Book workflow
- **Files modified**:
  - `src/pages/BooksPage.jsx`
  - `src/components/Books/BookList.jsx`
  - `src/components/Books/AddBookForm.jsx`
  - `src/components/Books/Books.css`
  - `src/components/layout/MainLayout.jsx`
  - `src/styles/global.css`
- **Changes**:
  - Redesigned the reader book page as a compact enterprise dashboard with statistics, filters, card grid, and integrated right sidebar widgets.
  - Added book cover thumbnails, compact metadata grouping, availability progress, and hover elevation to book cards.
  - Moved Popular Books into the right dashboard sidebar and added Recently Borrowed and System Stats widgets.
  - Added user avatar styling and reduced top navigation height.
  - Converted Add New Book into a modal flow.
- **Reason**: Improve layout balance, visual hierarchy, content density, and professional dashboard appearance.

### Fix 84: Redesign batch import and remove copy-only fields from book metadata
- **Files modified**:
  - `src/components/Books/AddBookForm.jsx`
  - `src/components/Books/Books.css`
  - `backend/controllers/bookController.js`
  - `API_DOC.md`
- **Changes**:
  - Removed `location` and `total_copies` from the single book metadata form.
  - Added a two-panel Batch Import layout with ISBN list input, CSV/TXT upload, live preview, duplicate/invalid status, import progress, and Copy Settings.
  - Moved default location, copies per book, and category assignment into Copy Settings.
  - Updated backend batch import to accept `location`, `total_copies`, and `category_id`.
- **Reason**: Keep metadata import separate from physical copy generation and support realistic library inventory workflows.

### Fix 85: Fix Books page search field icon and text visibility
- **Files modified**:
  - `src/pages/BooksPage.jsx`
  - `src/components/Books/Books.css`
- **Changes**:
  - Replaced the shared search input classes with `books-search-*` classes to avoid global style collisions.
  - Replaced the image-based magnifier with a CSS-drawn absolute-positioned icon.
  - Set search input text, caret, and placeholder colors explicitly.
- **Reason**: Fix the misaligned search icon and invisible search text caused by shared CSS overrides and asset positioning.

### Documentation: Update development documentation
- **Files modified**:
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated the latest feature status, dashboard layout notes, Add Book modal workflow, and Batch Import Copy Settings behavior.
  - Documented the current batch import payload fields.
  - Added this BUGFIX_LOG section covering the prior borrow/copy-management commit and the latest dashboard/import/search fixes.
- **Reason**: Keep development documentation synchronized with the current branch implementation.

## 2026-05-10

### Fix 86: Wait for batch import copy inserts before commit
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `README.md`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Refactored `batchImportBooks` to use awaitable SQLite helpers for `db.run`, `db.get`, prepared statement `run`, and `finalize`.
  - Ensured category inserts, all copy inserts, and `insertCopy.finalize()` complete before incrementing `results.success`.
  - Moved `COMMIT` and response sending after all books finish processing.
  - Added rollback handling for unexpected transaction-level failures.
- **Reason**: Prevent incorrect success counts and avoid copy inserts running outside the intended batch import transaction lifecycle.

### Fix 87: Correct add copy API response documentation
- **Files modified**:
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated `POST /api/books/:book_id/copies` response documentation to match `bookController.addBookCopy`.
  - Documented the actual flat copy object response instead of a wrapped `{ message, copy, book }` payload.
- **Reason**: Keep the API contract documentation aligned with the current endpoint implementation and frontend usage.

### Fix 88: Correct batch import API request and response documentation
- **Files modified**:
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated `POST /api/books/batch` request documentation from a raw JSON array to `{ "books": [...] }`.
  - Removed the undocumented `message` field from the documented response shape.
- **Reason**: Align API documentation with `bookController.batchImportBooks` and the frontend `booksAPI.batchImport` request contract.

### Fix 89: Upsert missing system settings and provide UI defaults
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/systemController.js`
  - `src/pages/SystemSettingsPage.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added seed rows for all keys used by `SystemSettingsPage`, including `system_name`, `system_version`, `max_renew_times`, and `renew_days`.
  - Changed `updateSystemSettings` from `UPDATE ... WHERE key = ?` to an upsert so missing keys are created instead of silently affecting 0 rows.
  - Added frontend default-setting merge so absent values render editable defaults instead of `undefined`.
  - Updated system settings API documentation to describe object responses and upsert behavior.
- **Reason**: Ensure fresh databases can display and save every documented system setting reliably.

### Fix 90: Remove duplicate history UI styles from Borrow CSS
- **Files modified**:
  - `src/components/Borrow/Borrow.css`
  - `DESIGN_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Removed duplicate `.history-toolbar`, `.history-sort-button`, and `.history-pagination` definitions from `Borrow.css`.
  - Kept the shared history UI styles in `src/styles/global.css`.
  - Documented that cross-page shared UI styles belong in `global.css`.
- **Reason**: Avoid global class style conflicts caused by duplicate definitions and CSS load order.

### Fix 91: Use OpenLibrary cover URL fallbacks
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `src/utils/api.js`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated ISBN metadata cleanup to prefer `bookData.cover.large`, then `medium`, then `small`.
  - Kept a fallback for legacy `cover.id` values.
  - Returned an empty cover URL when OpenLibrary does not provide cover data.
  - Documented the cover image fallback behavior for `GET /api/books/isbn/:isbn`.
- **Reason**: Prevent broken cover image URLs when OpenLibrary returns cover URLs instead of `cover.id`.

### Fix 92: Normalize ISBN import publish date display
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `src/utils/api.js`
  - `src/components/Books/AddBookForm.jsx`
  - `README.md`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added OpenLibrary publish date normalization for common formats.
  - Normalizes full dates to `YYYY-MM-DD`, month/year values to `YYYY-MM`, and year-only values to `YYYY`.
  - Preserves the original OpenLibrary value when it cannot be parsed cleanly.
  - Changed the single-book Add Book publish date field from a native date input to a text input so partial dates can be displayed and edited.
- **Reason**: Prevent OpenLibrary values such as `July 2008` from disappearing in the Add Book form.

### Fix 93: Align book management search button
- **Files modified**:
  - `src/pages/BookManagementPage.jsx`
  - `src/components/Books/Books.css`
  - `README.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added a management-specific search bar class.
  - Fixed the search input and icon button into one horizontal row with consistent height.
  - Kept the change scoped away from shared `.search-bar` styles.
- **Reason**: Prevent the admin book management search button from dropping below the input due to global search bar styles.

### Fix 94: Align user management search button
- **Files modified**:
  - `src/components/Users/UserList.jsx`
  - `src/components/Users/Users.css`
  - `README.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added a user-management-specific search bar class.
  - Fixed the user search input and icon button into one horizontal row with consistent height.
  - Scoped the layout away from shared `.search-bar` styles.
- **Reason**: Prevent librarian/admin user management search buttons from dropping below the input.

### Fix 95: Preserve batch import language and page count
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `README.md`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated `batchImportBooks` to persist incoming `language` and `page_count` metadata.
  - Added defaults of `Chinese` and `0` only when those fields are missing or invalid.
  - Documented the batch import metadata persistence behavior.
- **Reason**: Prevent imported ISBN metadata from being overwritten by hardcoded language and page count values.

### Fix 96: Respect zero fine-per-day setting
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `backend/controllers/userController.js`
  - `README.md`
  - `API_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced `parseFloat(value) || 0.5` fine setting parsing with an explicit `Number.isNaN` fallback.
  - Preserved configured `fine_per_day = 0` for both return-time fine calculation and overdue fine previews.
  - Documented that setting `fine_per_day` to `0` disables overdue fines.
- **Reason**: Allow administrators to intentionally disable overdue fines without the backend falling back to the default value.

### Fix 97: Allow librarians to manage user fines
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `README.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated `getUserFines` authorization to allow self, admin, or librarian access.
  - Updated `payFine` authorization to allow self, admin, or librarian actions.
  - Documented that administrators and librarians can view and process user fines.
- **Reason**: Align fines endpoint authorization with the UI and API documentation.

### Fix 98: Serialize bulk copy location updates
- **Files modified**:
  - `src/components/Books/CopyManagementModal.jsx`
  - `README.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced parallel `Promise.all` copy location updates with sequential requests.
  - Kept the existing single-copy location endpoint unchanged.
  - Documented that bulk location updates are submitted sequentially.
- **Reason**: Prevent SQLite `cannot start a transaction within a transaction` errors caused by concurrent location update requests.

## 2026-05-12

### Feature: Complete Release 2 reservation notifications
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/borrowController.js`
  - `backend/controllers/notificationController.js`
  - `backend/routes/notificationRoutes.js`
  - `backend/server.js`
  - `src/App.jsx`
  - `src/components/Sidebar/Sidebar.jsx`
  - `src/components/Sidebar/Sidebar.css`
  - `src/pages/NotificationsPage.jsx`
  - `src/pages/NotificationsPage.css`
  - `src/utils/api.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `DATABASE_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `release_plan_v2.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added the `notifications` table and indexes.
  - Added notification APIs for list, unread count, single read, and read-all.
  - Triggered reservation availability notifications during return approval after available copies are recalculated.
  - Added the `/notifications` page and sidebar unread badge.
  - Documented notification schema, API contract, UI flow, and test cases.
- **Reason**: Finish Release 2 reservation notification requirements and make availability notices visible and trackable for readers.

### Feature: Add unread announcement reminders
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/announcementController.js`
  - `backend/routes/announcementRoutes.js`
  - `src/components/layout/MainLayout.jsx`
  - `src/styles/global.css`
  - `src/utils/api.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `DATABASE_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `release_plan_v2.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `announcement_reads` to record announcement read state per user.
  - Added endpoints for current-user unread announcements and marking announcements read.
  - Added a global popup reminder for unread published announcements in `MainLayout`.
  - Marked announcements as read when users acknowledge the reminder so read announcements do not repeat.
  - Documented the database table, API endpoints, UI behavior, and regression cases.
- **Reason**: Ensure important published announcements proactively reach users while preventing repeated reminders after acknowledgement.

### Fix 99: Convert announcement management form to an unclipped modal
- **Files modified**:
  - `src/pages/AnnouncementManagementPage.jsx`
  - `src/pages/AnnouncementManagementPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced the inline add/edit announcement form with a modal.
  - Rendered the modal with `createPortal(document.body)` so it is not constrained by page content layers.
  - Improved the announcement management list with content preview, published/draft status badges, and compact row actions.
  - Added modal-specific responsive sizing and internal scrolling.
- **Reason**: Prevent the announcement form from being clipped by parent layout/content layers and improve the management page usability.

### Fix 100: Improve batch ISBN import error reporting
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `src/components/Books/AddBookForm.jsx`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `release_plan_v2.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added backend validation for ISBN format, title, author, duplicate ISBNs, and copy count bounds.
  - Returned per-ISBN backend errors in the batch import result.
  - Merged frontend precheck and metadata lookup failures into the final import result display.
  - Documented the request/response behavior and mixed-success validation scenarios.
- **Reason**: Make batch import failures actionable instead of silently dropping failed ISBNs.

### Maintenance: Remove unused backend test scripts
- **Files modified**:
  - `backend/test_blocked_user.js`
  - `backend/test_constraints.js`
  - `backend/test_db.js`
  - `backend/test_renew_book.js`
  - `backend/test_reserve.js`
  - `backend/test_server.js`
  - `backend/test_simple.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Deleted unused `backend/test*.js` ad hoc scripts that were not referenced by npm scripts or active workflows.
  - Removed stale documentation references to `test_constraints.js`.
- **Reason**: Reduce lint noise and keep the backend utility surface focused on maintained check/fix scripts.

### Fix 101: Isolate borrow-record fine display styling
- **Files modified**:
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/components/Borrow/Borrow.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `RELEASE2_NOTES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced the borrow-record table cell class `fine-amount` with borrow-specific `borrow-fine-amount` and `borrow-fine-empty` classes.
  - Removed the generic `.fine-amount` rule from `Borrow.css` so borrow table cells are not affected by fine detail or profile page styles.
  - Normalized borrow-record fine rendering through numeric conversion before formatting amounts.
  - Documented the styling isolation and visual regression check.
- **Reason**: Prevent global fine amount styles from creating stray borders/layout artifacts in the borrow-record Fine column and avoid formatting errors when fine values are returned as strings.

### Fix 102: Lift Add Book modal and simplify sort labels
- **Files modified**:
  - `src/pages/BookManagementPage.jsx`
  - `src/components/Books/Books.css`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/UserBorrowRecords.jsx`
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/LogsPage.jsx`
  - `src/pages/ReservationsPage.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Rendered the Add New Book modal with `createPortal(document.body)` and added a dedicated high-z-index overlay class.
  - Updated list sort toggle labels from `Oldest First` / `Newest First` to `Ascending` / `Descending`.
  - Documented the modal layering behavior and sort-label regression checks.
- **Reason**: Keep the Add New Book modal independent from book page container stacking/clipping and make list sort controls simpler.

### Fix 103: Redesign System Settings with implemented options only
- **Files modified**:
  - `src/pages/SystemSettingsPage.jsx`
  - `src/pages/SystemSettingsPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced the raw single-list settings form with a modern dashboard layout using grouped cards, search, Editable mode, top actions, and a sticky pending-changes save bar.
  - Removed settings from the UI that are not currently consumed by backend business logic.
  - Kept only implemented borrow, renewal, and fine settings in the admin settings interface.
  - Documented the supported settings surface and regression checks.
- **Reason**: Avoid exposing configuration fields that can be saved but do not affect system behavior, while improving settings page density, hierarchy, and usability.

### Fix 104: Add validation to all login page auth forms
- **Files modified**:
  - `src/components/Login/Login.jsx`
  - `src/components/Login/Login.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added field-level validation for login, registration, forgot-password, and reset-password forms.
  - Aligned frontend rules with backend constraints for username, password, name, and email.
  - Added phone/contact validation for password reset requests and password confirmation/token validation for reset submission.
  - Added inline field errors and error input styling.
  - Documented auth-form validation behavior and regression cases.
- **Reason**: Prevent invalid auth form submissions earlier and give users clear field-level feedback before API requests.

### Fix 105: Sync notification badges and notify reservations on new availability
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `backend/controllers/borrowController.js`
  - `backend/utils/notificationUtils.js`
  - `src/App.jsx`
  - `src/context/NotificationContext.jsx`
  - `src/context/notificationContext.js`
  - `src/context/notificationHooks.js`
  - `src/components/Sidebar/Sidebar.jsx`
  - `src/pages/NotificationsPage.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `RELEASE2_NOTES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Extracted reservation availability notification creation into a shared backend utility.
  - Triggered reservation notifications after adding a new available copy or changing a copy status to `available`.
  - Added shared frontend notification state so Sidebar unread badges update immediately after mark-read actions.
  - Added a compatibility re-export for the notification hook module to avoid stale Vite HMR requests.
  - Documented the expanded notification trigger paths and badge sync behavior.
- **Reason**: Ensure reservations do not become stale when inventory is restored outside return approval, and keep unread notification badges synchronized without navigation or refresh.

### Fix 106: Add global borrowing feature toggle
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/systemController.js`
  - `backend/routes/systemRoutes.js`
  - `backend/controllers/borrowController.js`
  - `src/utils/api.js`
  - `src/pages/SystemSettingsPage.jsx`
  - `src/components/Books/BookList.jsx`
  - `src/pages/BookDetailsPage.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `DATABASE_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `borrow_enabled` to default system settings with enabled-by-default behavior.
  - Added `GET /api/system/feature-flags` so logged-in users can read frontend-relevant feature switches without full admin settings access.
  - Enforced the borrowing switch on both `POST /api/borrow/borrow` and `POST /api/borrow/confirm-borrow`.
  - Added a `Borrowing Enabled` checkbox to System Settings and disabled reader borrow/confirm controls when the switch is off.
  - Documented the setting, API behavior, database default, and regression test case.
- **Reason**: Complete Release 3 system-parameter scope by giving admins a real on/off control for borrowing, with server-side enforcement rather than UI-only hiding.

### Documentation: Add Release 3 integration requirements
- **Files modified**:
  - `release_plan.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added Release 3 requirements for real Alipay fine payment with QR/link checkout and librarian income dashboard.
  - Added Release 3 requirements for real email delivery during registration, password reset, and notification scenarios.
  - Added Release 3 requirements for selectable ISBN lookup API nodes with provider health testing and explicit node switching.
- **Reason**: Capture newly requested Release 3 external-service integration scope in the release plan without changing implementation code.

### Fix 107: Add backend Alipay sandbox configuration
- **Files modified**:
  - `backend/config/alipayConfig.js`
  - `backend/server.js`
  - `backend/.env.example`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added a backend Alipay configuration module for sandbox/production mode, app ID, application private key, Alipay public key, gateway, notify URL, return URL, signing, encoding, response format, and timeout.
  - Added safe startup logging that reports enabled mode and whether required secret fields are present without printing key contents.
  - Added missing-configuration warnings when `ALIPAY_ENABLED=true`.
  - Added backend `.env.example` entries for Alipay sandbox integration.
  - Documented required Alipay resources and configuration validation behavior.
- **Reason**: Prepare Release 3 Alipay sandbox integration with backend-only secret handling before adding payment APIs.

### Fix 108: Use local Alipay callback URLs for test deployment
- **Files modified**:
  - `backend/.env.example`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed the default Alipay notify URL to `http://localhost:3001/api/payments/alipay/notify` for local backend testing.
  - Changed the default Alipay return URL to `http://localhost:5173/payment-result` for local frontend testing.
  - Documented that real sandbox callback testing still needs a public or tunneled notify URL because Alipay cannot call a developer machine's localhost directly.
- **Reason**: Align the current Alipay sandbox setup with the local deployment test environment.

### Fix 109: Add simulated Alipay fine payment APIs
- **Files modified**:
  - `backend/db.js`
  - `backend/controllers/paymentController.js`
  - `backend/routes/paymentRoutes.js`
  - `backend/server.js`
  - `src/utils/api.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `DATABASE_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added a `payments` table for Alipay fine payment orders, linked borrow record IDs, payment URLs, QR-code content, status, and notify payloads.
  - Added backend payment routes for Alipay configuration status, fine payment creation, payment lookup, local simulate-notify completion, real notify placeholder, and librarian/admin income summary.
  - Updated backend startup to load environment values from `backend/.env` explicitly so Alipay secrets stay backend-only.
  - Kept payment creation separate from fine settlement; fines are marked paid only after simulated notify succeeds.
  - Rejected simulated notify completion when linked pending-payment fines are no longer unpaid, avoiding duplicate income after another payment flow settles the same fines.
  - Recalculated `users.total_fine` after simulated payment completion.
  - Added frontend API wrappers for the new payment endpoints.
  - Documented the API, database schema, design behavior, and regression test case.
- **Reason**: Provide a local Alipay-shaped payment flow for Release 3 demos before wiring the real Alipay SDK and signature verification.

### Fix 110: Route Fine Records payment through Alipay simulation UI
- **Files modified**:
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/FineDetailsPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced the Fine Records page's direct `borrowAPI.payFine` button flow with `paymentAPI.createFineAlipayPayment`.
  - Added a simulated Alipay payment panel showing order number, amount, QR area, and payment link.
  - Added a local `Simulate Payment Success` action that calls the simulated notify endpoint before refreshing fine records.
  - Documented that creating a payment order no longer immediately settles fines from the frontend.
- **Reason**: Make the user-facing payment flow match the new Alipay-shaped backend flow instead of bypassing it through the legacy direct fine settlement endpoint.

### Fix 111: Remove direct fine settlement from borrow records modal
- **Files modified**:
  - `src/components/Borrow/BorrowRecords.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced the My Borrow Records fine modal's direct `borrowAPI.payFine` call with navigation to `/fines/:userId`.
  - Renamed the modal action to `Pay with Alipay`.
  - Removed the unused frontend `borrowAPI.payFine` wrapper so new UI code cannot accidentally use the legacy direct settlement endpoint.
  - Documented that user-visible fine payment now goes through the Fine Records Alipay simulation panel.
- **Reason**: Prevent the borrow records modal from bypassing the new Alipay payment flow and immediately marking fines as paid.

### Fix 112: Separate estimated fines from payable actual fines
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `backend/controllers/paymentController.js`
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/FineDetailsPage.css`
  - `src/pages/PaymentResultPage.jsx`
  - `src/pages/PaymentResultPage.css`
  - `src/App.jsx`
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/Borrow.css`
  - `package.json`
  - `package-lock.json`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `DATABASE_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Limited Alipay fine payment creation to actual unpaid fines from `returning` and `returned` borrow records.
  - Kept unreturned overdue records as estimated fines only, visible in borrow/fine history but excluded from payment orders.
  - Updated fine history responses to include borrow record status so the frontend can label Estimated, Unpaid, and Paid correctly.
  - Changed `users.total_fine` synchronization to count only actual unpaid fines.
  - Added QR code generation for the simulated Alipay payment link using `qrcode`.
  - Added a local `/payment-result` page so Open Alipay payment link opens in the browser during local simulation.
- **Reason**: Prevent users from paying estimated fines before returning books, include already-returned unpaid actual fines in payable totals, and make the simulated Alipay UI behave like a real QR/link payment surface.

### Fix 113: Refresh local payment-result status from backend
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `backend/routes/paymentRoutes.js`
  - `src/utils/api.js`
  - `src/pages/PaymentResultPage.jsx`
  - `src/pages/PaymentResultPage.css`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Removed the static `status=pending` query parameter from generated local payment links.
  - Added `GET /api/payments/trade/:out_trade_no` for querying a payment by merchant order number.
  - Updated `/payment-result` to load the latest payment status from the backend using `out_trade_no`.
  - Kept generated QR/payment links stable so reopening them after simulated payment shows the updated backend state.
- **Reason**: Prevent the local payment result page from showing stale `pending` status after simulated payment completion.

### Fix 114: Add payment order management dashboard
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `backend/routes/paymentRoutes.js`
  - `src/utils/api.js`
  - `src/App.jsx`
  - `src/components/Sidebar/Sidebar.jsx`
  - `src/pages/IncomeDashboardPage.jsx`
  - `src/pages/IncomeDashboardPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `GET /api/payments` with user, status, provider, payment type, and date filters.
  - Added `POST /api/payments/:id/expire` for expiring pending orders without settling fines.
  - Reused existing pending fine payment orders when the same user attempts to pay the same actual fine records again.
  - Added frontend payment list and expire API wrappers.
  - Added `/income-dashboard` for admin/librarian users with income cards, status filtering, payment rows, and pending-order expiration.
  - Added sidebar navigation for Income Dashboard.
- **Reason**: Complete local payment-management support before replacing the simulated provider with real Alipay gateway calls.

### Fix 115: Prevent Books list from showing all cards as borrowed during copy loading
- **Files modified**:
  - `src/components/Books/BookList.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed Books list availability calculation to use `book.available_copies` and `book.total_copies` while per-book copy details are still loading.
  - Continued to use loaded copy details once they are available.
  - Documented the fallback and regression case.
- **Reason**: Avoid temporarily rendering every book card as `Borrowed` because an unloaded copy list was treated as an empty list.

### Fix 116: Poll Alipay payment status and enforce local simulation state rules
- **Files modified**:
  - `backend/.env.example`
  - `backend/config/alipayConfig.js`
  - `backend/controllers/paymentController.js`
  - `backend/routes/paymentRoutes.js`
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/PaymentResultPage.jsx`
  - `src/pages/PaymentResultPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `ALIPAY_SIMULATION_ENABLED`, defaulting local simulation to enabled in sandbox mode and exposing the safe flag through the Alipay status endpoint.
  - Allowed logged-in users to read the safe Alipay status summary so Fine Records can decide whether to show the local simulation button.
  - Added Fine Records polling of `GET /api/payments/:id` every 2.5 seconds, refreshing fines when an order becomes `paid` and prompting users to create a new order when it becomes `expired`.
  - Added `/payment-result` manual refresh and automatic polling by `out_trade_no`.
  - Hid `Simulate Payment Success` unless local simulation is enabled and the payment is still `pending`.
  - Rejected simulated success for expired orders and preserved the existing restriction that only pending orders can be expired, so paid orders cannot be expired.
  - Documented that expired pending orders are not reused and a new order is created for the same fines after expiration.
- **Reason**: Make the local Alipay-shaped flow observable from both Fine Records and the payment result page while preventing invalid order state transitions before sandbox gateway integration.

### Fix 117: Generate Alipay sandbox cashier links and verify notify callbacks
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `backend/server.js`
  - `backend/services/alipayClient.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added an Alipay client helper for `alipay.trade.page.pay` request signing with the backend app private key.
  - Changed fine payment creation to generate a signed Alipay sandbox cashier URL when `ALIPAY_ENABLED=true` and all required Alipay settings are present.
  - Kept the local `/payment-result` payment URL as a fallback when Alipay is disabled or incomplete.
  - Added form-urlencoded parsing so Alipay notify callbacks can be read by Express.
  - Implemented Alipay notify signature verification with the configured Alipay public key.
  - Completed the local payment order through the existing fine settlement path when a verified notify reports `TRADE_SUCCESS` or `TRADE_FINISHED`, while checking app ID and amount and storing Alipay `trade_no` when present.
  - Documented sandbox link generation, notify behavior, and related manual test cases.
- **Reason**: Move from local-only simulation toward usable Alipay sandbox integration while preserving the existing local demo workflow.

### Fix 118: Sync pending payments with Alipay sandbox trade query
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `backend/services/alipayClient.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added signed `alipay.trade.query` request generation and gateway querying to the backend Alipay helper.
  - Updated `GET /api/payments/:id` and `GET /api/payments/trade/:out_trade_no` to actively synchronize pending orders when Alipay sandbox configuration is enabled and complete.
  - Completed local fine payment records when Alipay query returns `TRADE_SUCCESS` or `TRADE_FINISHED`.
  - Expired local pending orders when Alipay query returns `TRADE_CLOSED`.
  - Preserved the local pending state if the Alipay query times out or fails, keeping Fine Records and payment-result polling from breaking during local demos.
  - Documented active sandbox status synchronization and manual verification steps.
- **Reason**: Let local deployments without a public notify callback still observe sandbox payment completion through the existing polling and refresh UI.

### Fix 119: Normalize Alipay key bodies before signing
- **Files modified**:
  - `backend/config/alipayConfig.js`
  - `backend/.env.example`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added PEM normalization for Alipay private and public keys.
  - Supported both full PEM values and the single-line base64 key body commonly copied from Alipay sandbox tooling.
  - Automatically wraps bare private key bodies with `BEGIN/END PRIVATE KEY` and public key bodies with `BEGIN/END PUBLIC KEY`.
  - Updated environment examples and docs to explain the supported key formats.
- **Reason**: Prevent Node crypto signing from failing with `DECODER routines::unsupported` when the sandbox private key is configured without PEM headers.

### Fix 120: Fallback between PKCS#8 and PKCS#1 Alipay private key containers
- **Files modified**:
  - `backend/services/alipayClient.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Kept `ALIPAY_SIGN_TYPE=RSA2` mapped to Node's `RSA-SHA256` signing algorithm.
  - Added signing fallback that tries both `PRIVATE KEY` and `RSA PRIVATE KEY` PEM containers for the configured application private key.
  - Documented that RSA2 is the default signing mode and private keys may be PKCS#8 or PKCS#1.
- **Reason**: Some Alipay sandbox tools export PKCS#1 private keys, which fail if wrapped only as PKCS#8 even though the signing algorithm is correctly set to RSA2.

### Fix 121: Use Alipay precreate QR content for scannable sandbox payments
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `backend/services/alipayClient.js`
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/FineDetailsPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added signed `alipay.trade.precreate` requests to obtain Alipay's dedicated QR code payload for sandbox fine payments.
  - Kept `alipay.trade.page.pay` as the browser payment link shown by `Open Alipay payment link`.
  - Used precreate `qr_code` for the Fine Records QR image when available, falling back to the page-pay URL only if precreate fails.
  - Increased the Fine Records QR image size and margin to improve scan reliability.
  - Documented the QR source split between `qr_code` and `payment_url`.
- **Reason**: Encoding the full signed page-pay URL produced an overly dense QR code that was difficult or impossible for Alipay clients to scan.

### Fix 122: Show completed mark over paid Alipay QR code
- **Files modified**:
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/FineDetailsPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added a paid-state overlay on the Fine Records Alipay QR code using `public/打勾.png`.
  - Dimmed the QR image after payment completion while keeping the original QR visible behind the completion mark.
  - Documented the paid QR visual state and regression expectation.
- **Reason**: Make successful payment state immediately visible in the payment panel after polling or simulation marks an order as paid.

### Fix 123: Center and widen the borrow-records fine modal
- **Files modified**:
  - `src/components/Borrow/BorrowRecords.jsx`
  - `src/components/Borrow/Borrow.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Rendered the borrow confirm and fine modals through React portals attached to `document.body`.
  - Updated the modal overlay to fill and center against the viewport instead of being constrained by the borrow-records container.
  - Added a wider `fine-modal-content` layout for the My Fines modal.
  - Wrapped the fine table in a horizontal scroll container and assigned stable column widths.
  - Kept fine amount and status cells on one line while allowing long book titles to wrap naturally.
- **Reason**: The fine modal was visually centered inside the borrow-records container and too narrow for dense fine rows, causing poor readability and awkward text wrapping.

### Fix 124: Stretch borrow fine modal for wide desktop layouts
- **Files modified**:
  - `src/components/Borrow/Borrow.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Increased the My Fines modal desktop width from 960px to 1280px.
  - Expanded the fine table minimum width and individual column widths to use the wider modal.
  - Updated docs and regression expectations for the wide modal layout.
- **Reason**: The centered fine modal still felt too narrow for dense overdue/fine records after the first layout fix.

### Fix 125: Override base modal width for My Fines
- **Files modified**:
  - `src/components/Borrow/Borrow.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed the My Fines modal selector to `.modal-content.fine-modal-content` so it overrides the base `.modal-content` 600px maximum width.
  - Set the fine modal width to `min(1240px, calc(100vw - 32px))` with no inherited max-width cap.
  - Updated docs and regression expectations to call out the base modal override.
- **Reason**: The earlier wide modal style could still be constrained by the shared modal container rule, leaving the fine modal visually close to its old narrow width.

### Fix 126: Add selectable ISBN lookup providers
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `backend/routes/bookRoutes.js`
  - `src/utils/api.js`
  - `src/components/Books/AddBookForm.jsx`
  - `src/components/Books/Books.css`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added backend ISBN provider definitions for OpenLibrary, Google Books, and ShowAPI ISBN.
  - Added `SHOWAPI_ISBN_APP_KEY` environment configuration for the ShowAPI appKey.
  - Added provider listing and health-test endpoints with availability, status, latency, timestamp, endpoint, and error details.
  - Moved ISBN lookup behind the backend API and added provider selection through the `provider` query parameter.
  - Added ISBN Lookup API selection and Test Node controls to Add New Book.
  - Updated single ISBN search and batch import metadata preview to use the selected provider.
  - Disabled ISBN lookup/import controls when the selected provider has been tested and is unavailable.
  - Documented the new API endpoints and regression test case.
- **Reason**: Complete the Release 3 ISBN node selection requirement and remove the hardcoded frontend OpenLibrary lookup path.

### Fix 127: Keep ShowAPI appKey in backend environment
- **Files modified**:
  - `backend/server.js`
  - `backend/.env.example`
  - `README.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated backend startup to read `backend/.env` explicitly.
  - Added the ShowAPI example variable to `backend/.env.example`.
  - Documented that `SHOWAPI_ISBN_APP_KEY` belongs in `backend/.env` for separated frontend/backend deployments.
- **Reason**: Keep backend-only provider secrets out of frontend/root environment files.

### Fix 128: Preserve selected ISBN provider after node testing
- **Files modified**:
  - `src/components/Books/AddBookForm.jsx`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed ISBN provider loading so it preserves the current selected provider when the provider list refreshes.
  - Only falls back to the first provider if the current selection no longer exists.
  - Captured the provider being tested before the async request so returned test status is written to the correct provider entry.
- **Reason**: Prevent the ISBN Lookup API selector from jumping back to the first provider after testing a non-default node.

### Fix 129: Add automatic backend proxy for ISBN provider requests
- **Files modified**:
  - `backend/controllers/bookController.js`
  - `backend/.env.example`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added automatic proxy detection for backend outbound ISBN provider requests.
  - Added `BACKEND_PROXY_MODE`, `BACKEND_PROXY_HOST`, and `BACKEND_PROXY_PORT` backend environment settings.
  - Defaulted proxy mode to `auto` with `127.0.0.1:7890`; requests use the proxy only when the port is reachable.
  - Documented proxy configuration and the expected fallback behavior when the local proxy is disabled.
- **Reason**: Allow ISBN metadata requests to use the local proxy when it is running without breaking default direct network access.

### Fix 130: Add backend undici dependency for ISBN proxy support
- **Files modified**:
  - `backend/package.json`
  - `backend/package-lock.json`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `undici` to backend dependencies so `bookController.js` can load `ProxyAgent`.
  - Chose the Node 18+ compatible v6 dependency range to keep release runtime compatibility with the project Node 20+ baseline.
  - Documented that backend dependencies need to be installed after switching to the Release 3 branch.
- **Reason**: The ISBN provider selection branch introduced `require('undici')` for proxy support, but the backend dependency manifest did not include it, causing startup to fail with `Cannot find module 'undici'`.

### Fix 131: Prevent stale Alipay QR reuse and polling 500s
- **Files modified**:
  - `backend/controllers/paymentController.js`
  - `src/App.jsx`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Stopped falling back to the signed page-pay URL as the QR payload when Alipay sandbox is enabled.
  - Required `alipay.trade.precreate` to return a QR payload before creating a sandbox payment order.
  - Refreshed reusable pending orders whose stored QR payload still equals the old page-pay URL.
  - Changed Alipay trade-query amount mismatch and synchronization errors to return the local payment row instead of a 500 response, keeping frontend polling alive.
  - Rewrapped the app with `Router` outside the auth/toast/notification providers while keeping `AuthProvider` above `NotificationProvider`.
- **Reason**: Old pending orders could keep unscannable page-pay QR content, and trade-query mismatches could make Fine Records polling fail with 500; the provider tree also needed to stay stable after the branch merge.

### Fix 111: Preserve ShowAPI description in single ISBN add
- **Files modified**:
  - `src/components/Books/AddBookForm.jsx`
  - `README.md`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Compared `showapi_sample.json` with the ShowAPI normalization code.
  - Kept the existing backend mapping from `showapi_res_body.data.gist` to `description`.
  - Updated single-book ISBN lookup form state so fetched `description` and `cover_image` are preserved when submitting the book.
  - Documented the ShowAPI field mapping and noted that `edition`, `paper`, `format`, `price`, `binding`, and `produce` currently have no matching book-table fields.
- **Reason**: Prevent ShowAPI book summaries from being dropped during single-book add while keeping unsupported provider-specific fields explicitly documented.

### Fix 132: Replace system feature checkbox with toggle switch
- **Files modified**:
  - `src/pages/SystemSettingsPage.jsx`
  - `src/pages/SystemSettingsPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Replaced the raw checkbox rendering for boolean system settings with a sliding toggle control.
  - Added Enabled/Disabled status text next to the switch.
  - Hid the native checkbox while preserving keyboard focus and disabled behavior.
  - Kept numeric settings on the existing input layout.
- **Reason**: The native checkmark checkbox looked visually inconsistent with the dashboard-style System Settings page.

### Fix 133: Add QQ email delivery service
- **Files modified**:
  - `backend/package.json`
  - `backend/package-lock.json`
  - `backend/.env.example`
  - `backend/config/emailConfig.js`
  - `backend/services/emailService.js`
  - `backend/db.js`
  - `backend/controllers/userController.js`
  - `backend/controllers/systemController.js`
  - `backend/routes/systemRoutes.js`
  - `backend/server.js`
  - `backend/utils/notificationUtils.js`
  - `src/pages/SystemSettingsPage.jsx`
  - `src/pages/SystemSettingsPage.css`
  - `src/utils/api.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `DATABASE_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added Nodemailer-based QQ Mail SMTP support with `EMAIL_ENABLED`, `EMAIL_MODE`, `SMTP_*`, `EMAIL_FROM`, and `APP_PUBLIC_URL` backend settings.
  - Added `email_logs` to record skipped, logged, sent, and failed email attempts.
  - Sent registration, password reset, reservation notification, and admin test emails through the shared email service.
  - Pointed password reset email links at the existing `/login?token=...` reset flow.
  - Added admin email status and test endpoints under `/api/system/email`.
  - Added a System Settings Email Test card for admins to view email mode/configuration readiness and send a test email from the frontend.
  - Kept local development usable through `EMAIL_MODE=log` and documented that QQ Mail requires an SMTP authorization code instead of the login password.
- **Reason**: Release 3 requires real email delivery for account and notification flows while preserving a local test mode that does not depend on external SMTP credentials.

### Fix 134: Add email verification codes for registration and password reset
- **Files modified**:
  - `backend/db.js`
  - `backend/services/emailVerificationService.js`
  - `backend/controllers/userController.js`
  - `backend/routes/userRoutes.js`
  - `backend/middleware/validation.js`
  - `src/components/Login/Login.jsx`
  - `src/components/Login/Login.css`
  - `src/context/AuthContext.jsx`
  - `src/utils/api.js`
  - `README.md`
  - `DESIGN_DOC.md`
  - `API_DOC.md`
  - `DATABASE_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added `email_verification_codes` with hashed codes, purpose, expiry, and used status.
  - Added `POST /api/users/email-verification/send` for registration and password reset verification codes.
  - Required a 6-digit email verification code when registering and when submitting a password reset.
  - Sent a password reset verification code alongside the existing reset link email.
  - Added Send Code and verification-code fields to the registration form and reset-password form.
- **Reason**: Registration and password reset needed email ownership verification instead of only sending informational emails after the action.

### Fix 135: Add pagination to Books page
- **Files modified**:
  - `src/pages/BooksPage.jsx`
  - `src/components/Books/Books.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Added frontend pagination to the Books page with 12 books per page.
  - Added First, Previous, Next, and Last controls with disabled states.
  - Added a visible range summary for the current filtered result set.
  - Reset the current page when search, category, or quick availability filters change.
  - Passed only the current page of books to `BookList`, reducing per-page copy-detail loading work.
- **Reason**: Large book lists made the Books page dense and caused unnecessary detail loading for every filtered book at once.

### Fix 136: Redesign category management list layout with pagination
- **Files modified**:
  - `src/pages/CategoryManagementPage.jsx`
  - `src/pages/CategoryManagementPage.css`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Shifted the Category Management content left by removing the centered content container.
  - Expanded the page layout to a narrower left create/search card and a larger right list panel.
  - Changed the category list from a single vertical list to a two-column card grid.
  - Fixed category name badges to use a bounded grid column with two-line wrapping so long names cannot push action buttons outside the card.
  - Added hover tooltips for full category names.
  - Added a left-side category search input with a magnifier button that filters the right-side list and resets pagination.
  - Widened the right-side list area and changed edit mode to fixed input/action columns so Save and Cancel stay visible.
  - Added frontend pagination with 8 categories per page and First/Previous/Next/Last controls.
  - Added responsive fallback to a single-column list on smaller screens.
- **Reason**: The previous category list was too narrow and vertically long for librarian workflows with many categories.

### Fix 137: Remove obsolete release files and maintenance scripts
- **Files removed**:
  - `OPTIMIZATION_PLAN.md`
  - `git-github-guide.md`
  - `refactor_plan.md`
  - `RELEASE2_NOTES.md`
  - `Release1/.gitignore`
  - `release_plan_v2.md`
  - `sample.json`
  - `showapi_sample.json`
  - `vite.borrow-fine.log`
  - `backend/check_borrow_records.js`
  - `backend/check_db.js`
  - `backend/check_indexes.js`
  - `backend/check_user_status.js`
  - `backend/cleanup.js`
  - `backend/clear_borrowed_records.js`
  - `backend/fix_all_borrow_records.js`
  - `backend/fix_book_status.js`
  - `backend/fix_borrow_records.js`
  - `backend/fix_borrow_records_direct.js`
  - `backend/migrate_data.js`
  - `backend/migrate_database.js`
  - `backend/reset_categories.js`
  - `backend/update_book_data.js`
  - `backend/controllers/borrowController_new.js`
- **Files modified**:
  - `.gitignore`
  - `README.md`
  - `DESIGN_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Removed old planning documents, sample payloads, local logs, and one-off backend maintenance scripts that were not referenced by runtime routes or package scripts.
  - Updated project structure documentation to match the remaining source tree.
  - Kept current Release 3 documentation, environment examples, runtime source, dependency manifests, and build configuration.
- **Reason**: Reduce release package clutter and avoid shipping stale scripts or obsolete documents.

### Fix 138: Stop payment polling after terminal status
- **Files modified**:
  - `src/pages/FineDetailsPage.jsx`
  - `src/pages/PaymentResultPage.jsx`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Changed Fine Records payment polling to run only while the active order is `pending`.
  - Changed Payment Result polling to stop once the order reaches `paid`, `expired`, or `failed`.
  - Kept manual refresh available on the Payment Result page after polling stops.
- **Reason**: Avoid unnecessary network traffic and state updates after payment orders reach a terminal state.

### Fix 139: Parse log clear days before validation
- **Files modified**:
  - `backend/controllers/logController.js`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Parsed `days` before comparing it with zero in `clearSystemLogs`.
  - Allowed both numeric `0` and string `"0"` to clear all logs.
  - Kept positive integer validation for age-filtered cleanup and rejected invalid values.
- **Reason**: JSON bodies can send `days` as a string, and `"0"` should behave the same as numeric `0`.

### Fix 140: Remove duplicate schema definitions
- **Files modified**:
  - `backend/db.js`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Removed duplicate `CREATE TABLE IF NOT EXISTS` blocks for `payments`, `email_logs`, and `email_verification_codes`.
  - Kept the original schema definitions in the main initialization section.
  - Kept existing index creation for payment, email log, and email verification tables.
- **Reason**: Duplicate table definitions made schema maintenance harder even though `IF NOT EXISTS` prevented runtime failures.

### Fix 141: Correct delete copy API comment
- **Files modified**:
  - `src/utils/api.js`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Updated the `deleteCopy` wrapper comment from updating copy status to deleting a single copy.
- **Reason**: Keep API wrapper comments aligned with behavior for easier maintenance.

### Fix 142: Allow profile updates without role-change false positives
- **Files modified**:
  - `backend/controllers/userController.js`
  - `src/components/Users/EditUserForm.jsx`
  - `API_DOC.md`
  - `TEST_CASES.md`
  - `BUGFIX_LOG.md`
- **Changes**:
  - Stopped the profile edit form from submitting `role` unless an admin is editing a non-admin user's role.
  - Changed user update validation so an unchanged `role` value is ignored instead of treated as a role modification.
  - Kept non-admin role changes forbidden and kept admin creation through the update endpoint blocked.
  - Documented the user update role behavior and added a profile update regression test case.
- **Reason**: Editing personal information could fail with `Forbidden: only admin can modify user role` when the request carried an unchanged role value.

### Fix 143: Harden auth configuration, borrowing permissions, build cleanup, and dependency audit
- **Files modified**:
  - `backend/controllers/borrowController.js`
  - `backend/controllers/userController.js`
  - `backend/db.js`
  - `backend/server.js`
  - `backend/package.json`
  - `backend/package-lock.json`
  - `eslint.config.js`
  - `package.json`
  - `scripts/clean-dist.mjs`
  - `src/context/AuthContext.jsx`
  - `src/context/useAuth.js`
  - `src/pages/StatsPage.jsx`
  - `README.md`
  - `API_DOC.md`
  - `DESIGN_DOC.md`
- **Changes**:
  - Added ownership/staff checks for borrow confirmation and limited timeout/overdue maintenance endpoints to admin/librarian users.
  - Required `JWT_SECRET` in production and replaced the fixed development fallback with a random temporary secret.
  - Disabled default demo account seeding in production unless `SEED_DEFAULT_USERS=true` is explicitly set.
  - Split ESLint browser/ESM and backend CommonJS/Node configuration, and moved `useAuth` out of `AuthContext.jsx`.
  - Added a `prebuild` cleanup script for `dist` to avoid stale Windows build output blocking Vite.
  - Upgraded backend `nodemailer` and `sqlite3` to clear npm audit vulnerabilities.
- **Verification**:
  - `npm.cmd run build`
  - `npm.cmd run lint` (0 errors, existing React Hook dependency warnings remain)
  - `npm.cmd audit --omit=dev` in root and backend
  - Backend SQLite smoke test with `SELECT 1 AS ok`
- **Reason**: Close security issues found during the project scan and make build/audit checks repeatable.

