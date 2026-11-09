# Student Life Survey — Project 4

HTML, CSS, client-side JavaScript, Node.js, Express, and JSON-file storage.

## Run locally

1. Install Node.js 18 or newer.
2. Open terminal in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Visit http://localhost:3000.

## Data

- `data/accounts.json`: array of account objects with username, salted password hash in `password`, account ID, and account file path.
- `data/users/<id>.json`: unique account ID, username, and every survey input.
- The records page excludes password information.

## Deployment

Render Web Service: build command `npm install`, start command `npm start`. Set `DATA_DIR=/var/data` and attach a persistent disk mounted at `/var/data` to retain accounts across restarts. **Render persistent disks may require a paid service.** Without a disk, the website works but data can disappear after redeploys or restarts. Do not use Render Static Sites.

## Security note

This is a course demonstration, not a production authentication system. Passwords are salted/hashed, login sessions are held in server memory (they reset when the server restarts), and records are accessible to any logged-in account as the rubric requires. Use test credentials, not personal passwords.
