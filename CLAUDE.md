# CLAUDE.md

Repository layout:

- [frontend/](/c:/Users/wood/codespace/czlnav/frontend) contains the original Next.js UI
- [go-backend/](/c:/Users/wood/codespace/czlnav/go-backend) contains the active Go runtime

Important notes:

- Frontend build must be run from `frontend/`
- Go build must be run from `go-backend/`
- Frontend pages no longer read the database during build
- Go is the only place that talks to SQLite

设计规范 (CZL frontend-design):

- 设计令牌定义在 `frontend/src/app/globals.css`, 调色板扩展在 `frontend/tailwind.config.js`
- 中性灰白主导, `--primary` 为近黑 (主 CTA), `--accent` 为浅灰 (hover 态), 二者均不是品牌色
- 品牌色 `--brand` (`#2EA7E0`) 仅在 focus ring / Logo / Hero 单一点缀使用; tailwind 暴露 `bg-brand` / `text-brand` / `ring-brand`
- 公开端 (首页 + `c/[slug]` 分类页) 沿用 liquid-glass 玻璃风格配深背景图, 不替换为黑白灰
- 后台 (`/admin/*`) 按 CZL 规范走 "灰底浮卡 + 中性深色识别" 风格, 选中态用 accent 浅灰 + 加粗

Primary commands:

```powershell
cd frontend
npm install
npm run build

cd ../go-backend
go build ./...
go run .
```
