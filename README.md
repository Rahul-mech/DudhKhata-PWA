# DudhKhata PWA

Clean digital milk ledger based on fat percentage.

## Live Features
- Google Login
- Contacts (Customer / Supplier)
- Daily Milk Entry (Morning + Evening + live calculation)
- Extra Transactions (Advance / Ghee / Other)
- Dashboard with today + month totals
- Settings (change Base Rate)
- Offline support via Firestore persistence

## Formula
```
Amount = Litres × Fat × (Base Rate ÷ 10)
```

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4
- Firebase Auth + Firestore

## Run locally
```bash
npm install
npm run dev
```

## Deploy
Connect this repo to Vercel or Render and deploy.

Make sure Firebase Authentication (Google) and Firestore are enabled in your Firebase project.
