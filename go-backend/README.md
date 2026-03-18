# Go Backend

`go-backend/` is the active runtime server.

## Responsibilities

- Serve `/api/*`
- Handle OAuth cookies and admin auth
- Serve uploaded files from `/uploads/*`
- Serve exported frontend assets from `frontend/out`

## Local commands

```powershell
cd go-backend
go build ./...
go run .
```

## Runtime environment

- `APP_URL`
- `PORT`
- `DATABASE_PATH`
- `UPLOAD_DIR`
- `FRONTEND_DIST_DIR`
- `ADMIN_DIST_DIR`
- `CZL_CONNECT_CLIENT_ID`
- `CZL_CONNECT_CLIENT_SECRET`
- `AUTH_CALLBACK_URL`
