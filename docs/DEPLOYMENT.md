# Deployment Guide (Online Hosting)

Panel requirement: deploy the system so clients can book **anytime**. This guide covers Firebase Hosting (recommended for this stack) and alternatives.

## Live URLs (Estandarte — May 2026)

| Platform | URL | Status |
|----------|-----|--------|
| **Firebase Hosting** | https://dental-clinic-system-8ec1c.web.app | **Deployed** |
| Firebase (alt) | https://dental-clinic-system-8ec1c.firebaseapp.com | Same site |
| **Vercel** | — | Requires `vercel login` on your machine (see below) |

**One-time setup:** `https://dental-clinic-system-8ec1c.web.app/?setup_key=estandarte-setup-2026#/setup`

See also [LIVE_URLS.md](./LIVE_URLS.md).

---

## Option A — Firebase Hosting (recommended)

Matches the current codebase (Firestore, Auth, Hosting).

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)

### Steps

1. **Configure environment**

   Copy `.env.example` to `.env` and fill `VITE_FIREBASE_*` values from Firebase project settings.

2. **Build**

   ```bash
   npm install
   npm run build
   ```

3. **Login and select project**

   ```bash
   firebase login
   firebase use <your-project-id>
   ```

4. **Deploy rules, functions, hosting**

   ```bash
   firebase deploy --only firestore:rules,storage,functions,hosting
   ```

5. **Production setup page** (one-time clinic accounts)

   Set `VITE_SETUP_SECRET` in hosting env (Firebase Hosting rewrites need build-time vars — set in CI or `.env.production` before build).

   Open: `https://YOUR_DOMAIN/?setup_key=YOUR_SECRET#/setup`

6. **Custom domain** (optional)

   Firebase Console → Hosting → Add custom domain → follow DNS instructions.

### CI/CD

GitHub Actions workflows exist under `.github/workflows/` for deploy on merge to main.

---

## Option B — Vercel / Netlify (frontend only)

- Connect GitHub repo.
- Build command: `npm run build`
- Output directory: `dist`
- Add all `VITE_FIREBASE_*` environment variables in the dashboard.
- **Still use Firebase** for database and auth (no change to backend).

---

## Option C — VPS (DigitalOcean, GCP VM, Render)

Use when the clinic wants a dedicated server.

1. Provision Ubuntu VPS (1 GB RAM minimum).
2. Install Node 18, nginx, certbot.
3. Build locally or on server: `npm run build`.
4. Serve `dist/` with nginx; enable HTTPS (Let’s Encrypt).
5. Keep Firebase as backend (simplest) **or** migrate API later.

Example nginx root:

```nginx
server {
  listen 443 ssl;
  root /var/www/estandarte/dist;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Post-deployment checklist

| Task | Done |
|------|------|
| Firestore security rules deployed | ☐ |
| Storage rules deployed | ☐ |
| Run `/setup` or create doctor/staff accounts | ☐ |
| Test patient booking on live URL | ☐ |
| Test staff mark cash paid + invoice | ☐ |
| Remove or rotate any demo passwords | ☐ |
| Share live URL with clinic for pilot | ☐ |

---

## Monitoring

- Firebase Console → Authentication, Firestore usage, Hosting traffic.
- Enable Firebase App Check for production abuse protection (optional).

---

## Support contacts

Document your Firebase project ID, hosting URL, and admin contact for the clinic handover section of your thesis.
