# Parijs schoolreis app v0.11.0

Versie 0.11 bouwt voort op de productiegerichte basis en vereenvoudigt de foto-updates:
- PostgreSQL-ready via `DATABASE_URL` met SQLite fallback voor lokaal testen
- persistente uploads voor docentfoto's en updates
- database-opslag voor site-inhoud, checklist, feed en push-subscriptions
- echte web-push via VAPID-sleutels
- rate limiting en veiligere headers voor het admin-paneel

## Lokaal starten
1. `cp .env.example .env`
2. vul minimaal `ADMIN_PASSWORD` en `SESSION_SECRET` in
3. `npm install`
4. `npm start`

## Nieuwe endpoints
- `GET /api/bootstrap`
- `GET/POST /api/checklist`
- `GET/POST /api/feed`
- `POST /api/push/subscribe`
- `POST /api/push/test`
- `GET /api/health`

## Uploads
Uploads worden standaard opgeslagen in `public/uploads`. Gebruik in productie een persistente disk of map.


## Vereenvoudigde foto-updates in v0.11
- per feed-update maximaal 1 foto
- eenvoudiger admin-formulier
- duidelijkere teksten in de interface
- geschikt voor snelle docentupdates onderweg
