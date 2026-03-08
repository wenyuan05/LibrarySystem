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
