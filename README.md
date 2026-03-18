# CZL Nav

Current repository layout:

- [frontend/](/c:/Users/wood/codespace/czlnav/frontend): original Next.js UI, exported as static files
- [go-backend/](/c:/Users/wood/codespace/czlnav/go-backend): Go runtime for API, auth, uploads, and static serving

## Local development

Frontend export:

```powershell
cd frontend
npm install
npm run build
```

Go backend:

```powershell
cd go-backend
go build ./...
go run .
```

## Runtime model

- The frontend build does not connect to a database
- Public and admin pages are static assets from `frontend/out`
- Go provides all data through `/api/*`
- SQLite is only handled by Go

## Main paths

- `/` public homepage shell + runtime data fetch
- `/c?slug=...` and `/c/{slug}` category shell + runtime data fetch
- `/admin/*` static admin app + runtime API fetch
- `/api/*` Go HTTP handlers

## Build and deploy

```powershell
docker compose up --build
```

See [DEPLOYMENT.md](/c:/Users/wood/codespace/czlnav/DEPLOYMENT.md) for deployment notes.
