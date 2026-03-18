FROM node:22-alpine AS frontend-builder

WORKDIR /src

COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /src/frontend
RUN npm ci --no-audit --no-fund

COPY frontend ./
RUN npm run build

FROM golang:1.25-alpine AS go-builder

WORKDIR /src

COPY go-backend/go.mod go-backend/go.sum ./go-backend/
RUN cd go-backend && go mod download

COPY go-backend ./go-backend

RUN cd go-backend && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/czlnav .

FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata wget

COPY --from=go-builder /out/czlnav /app/czlnav
COPY --from=frontend-builder /src/frontend/out /app/frontend-out

RUN mkdir -p /app/data /app/uploads

ENV APP_ENV=production
ENV APP_URL=http://localhost:3000
ENV PORT=3000
ENV DATABASE_PATH=/app/data/database.db
ENV UPLOAD_DIR=/app/uploads
ENV FRONTEND_DIST_DIR=/app/frontend-out
ENV ADMIN_DIST_DIR=/app/frontend-out/admin

EXPOSE 3000

CMD ["/app/czlnav"]
