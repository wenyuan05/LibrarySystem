# Release 2 Notes

## Version
- Frontend: `2.0.0`
- Backend: `2.0.0`

## Release Scope
- Password reset and authenticated password recovery flow.
- Borrow renewal with configurable renewal limits and renewal days.
- Reservation management with in-app availability notifications.
- Book edit/delete, category management, announcement management, unread announcement reminders, and system settings.
- Reader blocking/unblocking and fine management.
- ISBN lookup, batch ISBN import, copy location management, and batch return approval.

## Functional Split
- **Reader workflows**: borrow, return, renew, reserve, view fines, pay fines, receive reservation notifications, and acknowledge unread announcements.
- **Inventory workflows**: book metadata management, ISBN import, copy generation, copy status, and shelf location management.
- **Librarian workflows**: return approval, batch approval, reader management, category management, and book operations.
- **Admin workflows**: announcement modal creation/editing, system parameters, logs, user administration, and global release configuration.

## Completed In This Branch
- Added an in-app notifications table, API, route registration, and notification list page.
- Trigger reservation notifications when a returned copy becomes available during return approval.
- Added unread notification counts in the sidebar.
- Added announcement read tracking and one-time unread announcement popup reminders.
- Converted announcement create/edit into a portal modal and refreshed the announcement management list layout.
- Lifted the Add New Book modal into a portal layer above the book management container.
- Renamed list sort toggles from oldest/newest wording to `Ascending` / `Descending`.
- Redesigned System Settings into grouped dashboard cards and removed settings that are not wired to backend behavior.
- Added field-level validation to login, registration, forgot-password, and reset-password forms.
- Strengthened batch ISBN import validation and error reporting for invalid, duplicate, and metadata lookup failures.
- Confirmed fine calculation reads `fine_per_day` from system settings.
- Isolated borrow-record fine cell styling from global fine-detail/profile styles and normalized fine amount formatting.
- Removed unused backend `test*.js` scripts and updated documentation references.

## Validation Checklist
- Borrow and return a reserved book, approve return, then confirm the reserving user receives a notification.
- Open `/notifications`, mark one notification read, then mark all notifications read.
- Create a published announcement, log in as a reader, confirm the popup appears once, then verify it does not repeat after marking read.
- Open `/announcement-management`, create and edit announcements through the modal without clipping.
- Open `/book-management`, launch Add New Book, and confirm the modal is above the page container without clipping.
- Confirm borrow, fine, reservation, and log list sort toggles show `Ascending` / `Descending`.
- Open `/system-settings`, confirm only implemented borrow/renew/fine settings are shown, edit a value, and save via Save Changes.
- Confirm login, registration, forgot-password, and reset-password forms block invalid input with inline field errors.
- Import ISBNs with a mixed list of valid, duplicate, invalid, and unknown records and confirm all failures are shown.
- Confirm overdue return fines follow the configured `fine_per_day` value.
- Confirm borrow-record Fine cells show either `-` or `¥0.00` without stray borders or layout artifacts.
- Run frontend build and backend syntax checks before tagging `v2.0.0`.
