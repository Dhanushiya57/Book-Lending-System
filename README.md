# XML-Based Online Book Lending System

An online book lending web app built with HTML, CSS, JavaScript, and XML data files.

## Overview
This project allows users to:
- Register and login
- Browse books
- Borrow available books
- Return borrowed books
- View borrowing history

The app reads initial data from `books.xml` and `users.xml`, then stores updates in browser `localStorage` because browsers cannot directly write to local XML files.

## Tech Stack
- HTML5
- CSS3
- JavaScript (Vanilla)
- XML (`books.xml`, `users.xml` loaded client-side)
- Web Crypto API (`SHA-256` for password hashing)

## Project Structure
```
Book Lending System/
|- index.html
|- register.html
|- login.html
|- books.html
|- styles.css
|- app.js
|- auth.js
|- books.js
|- books.xml
|- users.xml
`- README.md
```

## Requirements
- XAMPP (or any local web server)
- Modern browser (Chrome, Edge, Firefox)

## How To Run
1. Put the folder in XAMPP htdocs:
   - `C:\xampp\htdocs\Book Lending System`
2. Open XAMPP Control Panel.
3. Start `Apache`.
4. Open browser and go to:
   - `http://localhost/Book Lending System/`

## Default Test Account
If your `users.xml` includes the sample user:
- Username: `alice`
- Password: `123456`

If login fails, clear storage first and refresh.

## Important Data Behavior
- First load: app reads XML files.
- After first load: app saves and reads updated XML strings from `localStorage`.
- This means browser storage can override file changes until you clear it.

## Reset Data
Use browser DevTools Console:
```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or call utility from console:
```js
utils.resetData();
```

## Validation Rules
- Username cannot be empty
- Username minimum length: 3
- Username allowed chars: letters, numbers, underscore (`_`)
- Password cannot be empty
- Password minimum length: 6

## Security Notes
- Passwords are hashed with `SHA-256` in the browser.
- Inputs are sanitized before use.
- Borrow/return actions require active login.
- Unavailable books cannot be borrowed.

## Main Scripts
- `auth.js`
  - Registration/login logic
  - Password hashing
  - Session handling
  - XML load/save helpers
- `books.js`
  - Book listing/search/filter
  - Borrow/return operations
  - Borrow history rendering
- `app.js`
  - Per-page initialization
  - Form event handling
  - View switching and UI wiring

## Troubleshooting
- Blank page or XML load errors:
  - Ensure you opened via `http://localhost/...` (not `file:///...`).
- Login issues after editing `users.xml`:
  - Clear `localStorage` and refresh.
- Books not updating:
  - Clear `localStorage` and reload app.

## Notes
This is a client-side educational project. For production use, move authentication and data operations to a secure backend and database.
