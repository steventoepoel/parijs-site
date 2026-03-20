# Parijs-site v0.03

Deze versie bevat:
- groepkiezer bij eerste bezoek
- knop bovenaan om te wisselen tussen Groep A en Groep B
- gedeelde mededelingen en Instagram-links
- aparte hotels, leiding, programma's, kamers en kaart per groep
- server-side admin login met sessies
- logo als echt bestand
- kaart zonder externe kaartbibliotheek, dus geen tile-fout

## Starten op Windows PowerShell

1. Pak de zip uit.
2. Open PowerShell in de map.
3. Installeer dependencies:

```powershell
npm install
```

4. Start de server met je eigen wachtwoord en sessiesleutel:

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="KiesHierEenSterkWachtwoord!"
$env:SESSION_SECRET="lange-unieke-sessie-sleutel-die-niemand-raadt-123456"
npm start
```

5. Open daarna:

```text
http://localhost:3000
```

## Standaard inlog
Als je geen environment variables instelt, dan gebruikt de server:
- gebruikersnaam: `admin`
- wachtwoord: `change-this-password-now`

Gebruik dat alleen tijdelijk en verander dit meteen.

## Bestanden
- `server.js` = server en login
- `data/site-data.json` = opgeslagen inhoud
- `public/index.html` = website
- `public/assets/logo.png` = logo

## Belangrijk
Voor productie is HTTPS aanbevolen.
