# Live deployment URLs

**Project:** `dental-clinic-system-8ec1c`  
**Last deployed:** May 2026

## Firebase Hosting (primary — live)

| URL | Use |
|-----|-----|
| https://dental-clinic-system-8ec1c.web.app | Main app (panel demo) |
| https://dental-clinic-system-8ec1c.firebaseapp.com | Alternate Firebase URL |

**Console:** https://console.firebase.google.com/project/dental-clinic-system-8ec1c/overview

### One-time clinic setup (production)

After deploy, create doctor/staff accounts:

```
https://dental-clinic-system-8ec1c.web.app/?setup_key=estandarte-setup-2026#/setup
```

Change `VITE_SETUP_SECRET` in `.env.production` before rebuild if you need a different key.

### Firebase Storage (optional)

Enable in console if uploads fail:  
https://console.firebase.google.com/project/dental-clinic-system-8ec1c/storage → **Get started**

Then run:

```bash
firebase deploy --only storage
```

## Vercel (secondary frontend)

Vercel was **not** deployed from this machine (CLI not logged in). To deploy:

```bash
npm i -g vercel
vercel login
cd dental-clinic-system-main
vercel --prod
```

Add the same `VITE_FIREBASE_*` variables in Vercel → Project → Settings → Environment Variables.

Add the Vercel domain to Firebase Auth → Settings → **Authorized domains**.

## Redeploy commands

```bash
npm run build
firebase deploy --only firestore:rules,hosting
```
