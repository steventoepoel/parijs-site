# Deploy-handleiding v0.10

## Aanbevolen productie-opzet
- **Webservice**: Render, Railway of een VPS met Node 20
- **Database**: PostgreSQL via `DATABASE_URL`
- **Uploads**: persistente disk gekoppeld aan `UPLOAD_DIR`
- **Push**: VAPID-sleutels invullen in de environment

## Render voorbeeld
1. Maak een nieuwe Web Service aan.
2. Koppel deze repo of upload de zip-inhoud.
3. Gebruik Node 20.
4. Voeg environment variables toe uit `.env.example`.
5. Koppel een PostgreSQL-database en kopieer de connection string naar `DATABASE_URL`.
6. Koppel een persistente disk en zet `UPLOAD_DIR=/var/data/uploads`.
7. Deploy.

## VAPID keys maken
Gebruik bijvoorbeeld lokaal:

```bash
npx web-push generate-vapid-keys
```

Zet daarna de output in:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Health check
Controleer na deploy:
- `/api/health`
- admin login
- foto-upload in de feed
- test push vanuit admin

## Opmerking
Deze versie gebruikt voor sessies nog steeds de SQLite session store. Dat werkt goed met één instantie en een persistente disk. Voor multi-instance scaling kun je later overstappen op een gedeelde session store.
