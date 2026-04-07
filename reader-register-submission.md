# Reader Registration Submission Notes

## User Story
As a reader, I want to register an account on the login page so that I can use the library system without asking an administrator to create an account for me.

## Acceptance Criteria
1. An unauthenticated user can switch from the login form to the registration form.
2. The user must provide a username, password, confirm password, name, and email before submitting.
3. The frontend blocks submission and shows a clear error when:
   - the username is shorter than 3 characters or longer than 20 characters
   - the password is shorter than 6 characters
   - the confirmed password does not match
   - the name is shorter than 2 characters or longer than 50 characters
   - the email format is invalid
4. If the username already exists, the system rejects the registration and shows a failure message.
5. If all fields are valid and the username is available, the system creates a new account with the `user` role.
6. After successful registration, the user is automatically signed in and redirected to the main page.

## Definition of Done
1. The registration flow is complete and stable enough for classroom demonstration.
2. Frontend validation matches the backend registration rules for the supported fields.
3. The following cases have been verified:
   - successful registration
   - duplicate username
   - invalid input
   - clearing stale input and errors after switching modes
4. The login and registration page remains usable on desktop and mobile layouts.
5. The feature is implemented on an isolated branch and is ready for a pull request review.

## Demo Talking Points
1. The feature entry is inside the public login page, so readers can self-register without librarian help.
2. The registration form adds confirmation password and clearer validation to reduce invalid submissions.
3. The backend API is unchanged and still creates a normal reader account with the `user` role.
4. After registration succeeds, the system automatically signs the reader in, which improves the first-use experience.
