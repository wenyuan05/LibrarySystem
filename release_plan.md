# Release 1
1.1	As a user, I want to login in/out the system，so I can use this system.
1.2	As a reader, I want to register an account if I do not have an account
1.3	As a reader, I want to browser and search the book list to know what book the library has and which to borrow.
1.4	As a reader, I want to be able to lock a book by clicking a button and  can borrow this book within a certain time limit. 
1.5	As a reader, I want to be able to have a button to send a request of returning books.
1.6	As a reader, I want to see the history of my borrowing so that I can find out if there is any book remaining to be returned.
	- Borrowing history must support pagination, keyword search, status filtering, and date range filtering when record volume grows.
1.7	As a librarian, I want to be able to add new books with the information of book details and amounts.
1.8	As a librarian, I want to handle all returning requests.
1.9	As a librarian, I want to see all book information.
1.10	As an admin, I want to be able to create accounts and manage all common user information, including change their roles.
# Release 2
2.1	As a user, I want to have a way to retrieve or reset my password in case I forget my password.
2.2	As a reader, I want to be able to renew a book by clicking a button.
2.3	As a reader, I want to be able to reserve books and have notifications when a book is ready.
2.4	As a librarian, I want to edit book information and can delete outdated book information.
2.5	As a librarian, I want to manage all categories for better book identification.
2.6	As a librarian, I want to block readers that have been overdue over certain times, which means they can not borrow books, and I can also unblock them.
2.7	As an admin, I want to be able to set system parameters, including borrowing period.
2.8	As an admin, I want to be able to issue an announcement to all users.
# Release 3
3.1	As a reader, I want to edit my personal information.
3.2	As a reader, I want to have book classified to browser by my taste.
3.3	As a reader, I want to see the top 10 popular books.
3.4	As a librarian, I want to see statistics of borrowing transaction.
3.5	As an admin, I want to be able to turn on/off some functions, like borrowing.
3.6	As an admin, I want to be able to check the log of the system.
	- System logs must support server-side pagination and filtering by keyword, action, user ID, and created date range.
3.7	As a reader, I want to pay overdue fines through a real Alipay integration, so that I can complete fine payment using an Alipay QR code or payment link.
	Acceptance criteria:
	- The system must integrate with the real Alipay API instead of a simulated local payment action.
	- When a reader pays fines, the frontend must display either an Alipay QR code or an Alipay payment link generated from the backend payment order.
	- Payment records must track payment order number, amount, user, related fine records, Alipay transaction status, paid time, and callback/notification result.
	- The backend must verify Alipay asynchronous notifications and update fine records only after a trusted paid status is received.
	- Librarians and admins must be able to view an income dashboard showing total fine revenue, daily/monthly revenue trends, successful/failed/pending payment counts, and recent payment records.
	- The dashboard must support filtering by date range and payment status.
	- Payment records must support pagination, keyword filtering, status filtering, and created date range filtering.

3.8	As a system user, I want the system to send real emails for account and notification events, so that important actions can reach my registered email address.
	Acceptance criteria:
	- The system must integrate with a real email provider or SMTP service configured through environment variables.
	- Registration success must send a welcome or account-created email to the user's account email.
	- Password reset must send a reset email containing a secure reset link or token instead of relying only on an in-app token response.
	- Reservation availability notifications, announcement reminders, and other important in-app notifications must also be eligible for email delivery when the target user has an email address.
	- Email sending must be logged with delivery status, recipient, template type, related notification/event ID, and error message when delivery fails.
	- The system must not expose SMTP credentials or email provider secrets in frontend code or committed files.

3.9	As a librarian, I want ISBN import to support selectable and testable lookup API nodes, so that I can choose a working ISBN metadata source before importing books.
	Acceptance criteria:
	- The system must support multiple ISBN lookup API nodes, such as OpenLibrary and any configured alternate providers.
	- The Add Book and Batch ISBN Import UI must allow librarians/admins to select the ISBN lookup node used for metadata queries.
	- The UI must provide a node test action that checks whether each configured ISBN API node is reachable and returns a clear available/unavailable status.
	- Test results must show provider name, endpoint, response status, latency, last tested time, and failure reason when unavailable.
	- ISBN lookup and batch import must use the selected node rather than a hardcoded provider.
	- If a selected node is unavailable, the UI must block import or clearly prompt the user to switch to another available node.
	- API node configuration must be maintainable without changing frontend code, preferably through backend configuration or system settings.
