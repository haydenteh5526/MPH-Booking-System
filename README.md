# MPH-Booking-System

Auth backend lives in `login-system/` to reduce merge conflicts.

How to run
- From project root: `cd login-system`
- Install deps: `npm install`
- Configure env: edit `login-system/.env` (MongoDB URI, secrets)
- Start server: `npm start` (http://localhost:3000)

Notes
- Registration requires `@student.tus.ie` email and verification via link.
- Login uses password + email code. Trusted devices (30 days) skip the code.
- Session idle timeout is 30 minutes (rolling) for all sessions.
- Without SMTP env vars, emails are logged to the console for dev.
