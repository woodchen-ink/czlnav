# CLAUDE.md

Repository layout:

- [frontend/](/c:/Users/wood/codespace/czlnav/frontend) contains the original Next.js UI
- [go-backend/](/c:/Users/wood/codespace/czlnav/go-backend) contains the active Go runtime

Important notes:

- Frontend build must be run from `frontend/`
- Go build must be run from `go-backend/`
- Frontend pages no longer read the database during build
- Go is the only place that talks to SQLite

Primary commands:

```powershell
cd frontend
npm install
npm run build

cd ../go-backend
go build ./...
go run .
```
