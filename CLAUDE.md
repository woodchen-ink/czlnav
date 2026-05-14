# CLAUDE.md

Repository layout:

- [frontend/](/c:/Users/wood/codespace/czlnav/frontend) contains the original Next.js UI
- [go-backend/](/c:/Users/wood/codespace/czlnav/go-backend) contains the active Go runtime

Important notes:

- Frontend build must be run from `frontend/`
- Go build must be run from `go-backend/`
- Frontend pages no longer read the database during build
- Go is the only place that talks to SQLite

静态资源缓存契约:

- `/_next/static/*`: `public, max-age=31536000, immutable` (Next.js 内容哈希命名, 永久缓存)
- `/static/*`, `/favicon.ico`, `/logo.*`: `public, max-age=86400`
- `/uploads/*`: `public, max-age=3600`
- HTML (`/`, `/c/{slug}`, `/admin/*`): `no-cache, no-store, must-revalidate` (Go 运行时占位符注入要每次拿最新数据)
- `/api/*`: `chiMiddleware.NoCache` 子路由全程禁缓存
- `/sw.js`: 永不缓存; 内容里的 `__APP_VERSION__` 占位符在 Go [handler/pages.go](go-backend/handler/pages.go) `ServeServiceWorker` 中替换为 `config.Version`

Service Worker (`frontend/public/sw.js`) 策略:

- 仅公开端注册 (`PublicSiteShell` 内 `useEffect`); admin 区与 `/api/admin/*` SW 不接管
- `/_next/static/*` cache-first; `/api/settings`、`/api/public/home`、`/api/public/category/{slug}` stale-while-revalidate; HTML navigation 与 `/uploads`、`/static` 网络优先回退缓存
- 版本号变化 ⇒ `sw.js` 字节变化 ⇒ install 新 SW ⇒ activate 清旧 cache; 前端不做"检查新版本 + 弹刷新提示", 用户下次刷新自动拿到新静态资源

版本号注入链路:

- 入口: GitHub Actions [.github/workflows/build.yml](.github/workflows/build.yml) tag 触发时把 `github.ref_name` (`vX.Y.Z`) 写入 `APP_VERSION` build-arg, 非 tag 用 `main-<sha7>`
- 传递: Dockerfile `ARG APP_VERSION` → `go build -ldflags "-X czlnav/config.Version=${APP_VERSION}"`
- 落地: `czlnav/config.Version` 包级变量 → `handler.ServeServiceWorker` 替换 `sw.js` 中 `__APP_VERSION__`
- 本地开发: 不带 ldflags 时 Version 为 `dev`, SW 仍可注册, 但版本不切换 (生产构建才切)

设计规范 (CZL frontend-design):

- 设计令牌定义在 `frontend/src/app/globals.css`, 调色板扩展在 `frontend/tailwind.config.js`
- 中性灰白主导, `--primary` 为近黑 (主 CTA), `--accent` 为浅灰 (hover 态), 二者均不是品牌色
- 品牌色 `--brand` (`#2EA7E0`) 仅在 focus ring / Logo / Hero 单一点缀使用; tailwind 暴露 `bg-brand` / `text-brand` / `ring-brand`
- 公开端 (首页 + `c/[slug]` 分类页) 沿用 liquid-glass 玻璃风格配深背景图, 不替换为黑白灰
- 公开端通过 `PublicSiteShell` 挂载 `SmoothScroll`, 鼠标滚轮以 rAF 缓动 (触控板/触屏放行); 主动忽略 `prefers-reduced-motion`
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
