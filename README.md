# MPH Booking – Login Module

Auth backend and static pages live in `login-system/`.

**Quick Start (CMD)**
- `cd login-system`
- `npm install`
- Copy `login-system/.env.example` to `.env` and fill values
- `npm start` then open `http://localhost:3000`

**Environment**
- Required: `MONGO_URI`, `SESSION_SECRET`, `ALLOWED_EMAIL_DOMAIN`, `APP_BASE_URL`
- Email (choose one):
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
  - Resend API (optional): `RESEND_API_KEY`, `MAIL_FROM`
- Defaults: `VERIFY_TOKEN_MINUTES=1440`, `RESET_TOKEN_MINUTES=60`, `SESSION_IDLE_MINUTES=30`, `LOCKOUT_THRESHOLD=5`, `LOCKOUT_MINUTES=15`

**Endpoints**
- `POST /auth/register` – body: `{ email, password }`
- `GET  /auth/verify-email?token=...` – marks email verified, shows confirmation page
- `POST /auth/resend-verification` – body: `{ email }`
- `POST /auth/login` – body: `{ email, password }`
- `POST /auth/forgot-password` – body: `{ email }`
- `POST /auth/reset-password` – body: `{ token, newPassword }`
- `POST /auth/logout`
- `GET  /dashboard` – requires session

**Pages**
- `/login.html`, `/register.html`, `/forgot.html`, `/reset.html?token=...`, `/verify.html`, `/resend.html`

**Behavior**
- Only `@student.tus.ie` emails may register (configurable via `ALLOWED_EMAIL_DOMAIN`).
- Email verification required to log in. Successful password reset also marks the email verified.
- Accounts lock for 15 minutes after 5 failed attempts.
- Sessions expire after 30 minutes of inactivity (rolling).

**SendGrid (SMTP) Quick Config**
- In `.env`:
  - `SMTP_HOST=smtp.sendgrid.net`
  - `SMTP_PORT=587`
  - `SMTP_SECURE=false`
  - `SMTP_USER=apikey`
  - `SMTP_PASS=<YOUR_SENDGRID_API_KEY>`
  - `MAIL_FROM=<your verified sender email>`

**Notes**
- `.env` is ignored by git; share it securely with teammates. Use `.env.example` as a template.
- If emails don’t send, check provider logs/activity and ensure `MAIL_FROM` matches a verified sender.
- If MongoDB Atlas times out from your network, test with a different network/VPN or a local MongoDB.
