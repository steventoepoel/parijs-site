# Parijs site v0.04

## Lokaal starten

```powershell
npm install
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="KiesHierEenSterkWachtwoord!2026"
$env:SESSION_SECRET="DitIsEenLangeUniekeSessieSleutelVanMinstens32Tekens"
npm start
```

Open daarna `http://localhost:3000`.

## Render

- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `SESSION_SECRET`

## Opmerking

- Sessies worden opgeslagen in SQLite in `data/app.db`
- Sitegegevens worden ook opgeslagen in dezelfde database
