# Bug Fix Log

This file documents all bug fixes applied to the project.

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
