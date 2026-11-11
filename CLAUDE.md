# CLAUDE.md

部署目标为 EdgeOne Makers: 构建期预渲染的 Next.js 静态站 + Node.js (TS) Cloud Functions + Blob 存储. 平台没有数据库, Blob 是唯一数据源.

发布链路: GitHub `main` → `.github/workflows/sync-cnb.yml` 同步到 `cnb.cool/czl/czlnav` → `.cnb.yml` 流水线 (拉 Blob 数据 → 预渲染 → `edgeone makers deploy`). 后台写操作成功后由函数调 CNB OpenAPI 触发同一流水线 (`api_trigger_publish`), 前台约 2–3 分钟后更新; 流水线带 `lock` + `cancel-in-progress`, 连续保存只发布最后一次.

仓库结构:

- [frontend/](frontend): Next.js 16 静态导出 (`output: 'export'`), 产物 `frontend/out`. 公开端 (首页、`/c/[slug]`) 构建期读 `src/data/site.json` 预渲染, 运行时不调接口; 搜索读静态索引 `/data/search.json` 本地过滤; 后台 `/admin/*` 仍运行时调 `/api/admin/*`
- [cloud-functions/](cloud-functions): 平台函数入口, 只做转发. `api/[[default]].ts` 承接全部 `/api/*`, `uploads/[[default]].ts` 从 Blob 读上传文件
- [server/](server): 后端实现 (路由 / handler / Blob 读写 / 鉴权), 被 `cloud-functions/` 引用; 不放进 `cloud-functions/` 是为了不被平台当成路由
- [scripts/](scripts): `build-site-data.ts` 构建前拉数据 (Blob 或 `--from-api`) 并把图标本地化压缩到 `frontend/public/icons/<内容哈希>.webp`, 生成 `site.json` / `search.json` (均不入库, 缺失时 Next 构建直接失败); `stamp-sw-version.mjs` 构建后注入 SW 版本号; `migrate-to-blob.ts` 一次性把旧 SQLite + 上传目录迁入 Blob
- [edgeone.json](edgeone.json): 构建命令、输出目录、旧分页地址重定向、缓存头 (Next.js 的 rewrites/headers 在静态导出下不生效, 一律写这里)
- [.cnb.yml](.cnb.yml): CNB 构建发布流水线; `EDGEONE_API_TOKEN` 来自密钥仓库 `czl/secrets` 的 `czlnav.yml`, 同时用于读 Blob 与部署. `edgeone makers deploy` 执行 `buildCommand` 时不透传外层环境变量, 所以拉数据必须在 deploy 之前单独一步
- [go-backend/](go-backend): 旧 Go + SQLite 运行时, 已不再部署, 仅作回滚参考; EdgeOne 稳定后连同 Dockerfile 一起删除

后端约定:

- TS 只用可擦除语法 (`erasableSyntaxOnly`), 不写 enum / 参数属性 / namespace, 保证 Node 原生 type stripping 可直接跑
- 响应契约沿用旧版: `{ success, message, data }`, 错误文案为中文, 前端直接展示 `message`
- Blob store `czlnav`, 一律 `consistency: "strong"`; 每张表一个 JSON 文档 `db/categories.json` / `db/services.json` (`{ seq, items }`, `seq` 只增不减, 删除后 ID 不复用) / `db/settings.json`; 只有管理员写, 不做并发控制
- 上传文件存 Blob `uploads/<rel>`, 对外路径 `/uploads/<rel>`; `frontend/public/uploads` 里的历史图标作为静态资源发布, 优先于函数命中
- 点击数不再由后端记录: 前端 `trackServiceClick` (`frontend/src/lib/analytics.ts`) 上报 CZL Connect 统计事件 `service_click`, 数据只在统计面板查看

后台登录 (CZL Connect OAuth2):

- 环境变量在 Makers 控制台配置: `CZL_CONNECT_CLIENT_ID`、`CZL_CONNECT_CLIENT_SECRET`、`AUTH_CALLBACK_URL` (生产必填, 与 CZL Connect 登记的回调地址完全一致; 函数内 `request.url` 不一定是公网域名, 不能靠它推导)、`ADMIN_USERS` (可选, 逗号分隔的用户 id 或 username, 不填则任何 CZL Connect 账号都是管理员)
- EdgeOne 函数网关只保留响应里最后一个 `Set-Cookie`, 任何响应只能写一个 cookie
- 会话只用一个 HMAC 签名 cookie `admin_session`: 内含 CZL Connect access_token 与用户 `id` / `username` (只存后台用到的字段; 曾存完整用户信息时登录后 cookie 不生效, 疑似超过浏览器约 4KB 上限被丢弃), 有效期随 access_token; 用户信息每 10 分钟用 access_token 重新拉取并续签. 不再写 `access_token` / `refresh_token` cookie; `oauth_state` 成功登录后靠 Max-Age 自然过期
- `Secure` 标志以 `AUTH_CALLBACK_URL` 的协议为准
- `CNB_TRIGGER_TOKEN` (只需 `repo-cnb-trigger:rw`) 用于后台保存后触发发布, `CNB_REPO` 默认 `czl/czlnav`; 未配置时只保存不发布
- `/admin/*` 页面本身是静态壳, 由 `app/admin/layout.tsx` 调 `/api/admin/account` 判断登录态; 数据安全靠 `/api/admin/*` 的服务端校验

缓存契约:

- `/_next/static/*`、`/icons/*`: `public, max-age=31536000, immutable` (文件名带内容哈希)
- `/data/*`: `public, max-age=0, must-revalidate`
- `/uploads/*`: `public, max-age=3600`
- HTML 与 `/sw.js`: `no-cache, no-store, must-revalidate`
- `/api/*`: 全部 `no-cache, no-store, must-revalidate` (`server/http.ts`)

Service Worker (`frontend/public/sw.js`):

- 仅公开端注册 (`PublicSiteShell` 内 `useEffect`); admin 区与 `/api/admin/*` SW 不接管
- `/_next/static/*`、`/icons/*` cache-first; `/data/*.json` 与 HTML navigation stale-while-revalidate (回访秒开, 新内容晚一次访问生效); `/uploads`、`/static` 网络优先回退缓存
- 版本号: 构建后 `scripts/stamp-sw-version.mjs` 把 `sw.js` 中的占位符替换为 `APP_VERSION` 环境变量, 未设置时用构建时间戳. 经 `edgeone makers deploy` 构建时 CLI 不透传环境变量, 实际总是构建时间戳: 每次发布都切换 SW 并清掉旧缓存, 旧 HTML 与旧 chunk 同批失效

设计规范 (CZL frontend-design):

- 设计令牌定义在 `frontend/src/app/globals.css`, 调色板扩展在 `frontend/tailwind.config.js`
- 中性灰白主导, `--primary` 为近黑 (主 CTA), `--accent` 为浅灰 (hover 态), 二者均不是品牌色
- 品牌色 `--brand` (`#2EA7E0`) 仅在 focus ring / Logo / Hero 单一点缀使用; tailwind 暴露 `bg-brand` / `text-brand` / `ring-brand`
- 公开端 (首页 + `c/[slug]` 分类页) 沿用 liquid-glass 玻璃风格配深背景图, 不替换为黑白灰
- 公开端滚动用浏览器原生行为, 不做鼠标滚轮 rAF 缓动 (锚点跳转的 `scroll-behavior: smooth` 由 `SmoothScrollScript` 处理, 与整页滚动无关)
- 后台 (`/admin/*`) 按 CZL 规范走 "灰底浮卡 + 中性深色识别" 风格, 选中态用 accent 浅灰 + 加粗

常用命令 (仓库根目录):

```powershell
npm install            # 函数依赖
npm run typecheck      # 后端类型检查
npm run data:api       # 从线上 API 拉数据与图标 (本地开发 / 构建前必跑); CI 发布用 `npm run data` 读 Blob
npm run build          # 前端预渲染 + SW 版本注入 (平台 buildCommand 同此命令, 不含拉数据)
npm run dev            # edgeone makers dev, 需先 edgeone login; 前端热更新另开 `cd frontend; npm run dev`, /api 反代到 8088

# 迁移: 先 dry-run 核对, 再带凭据正式写入
node scripts/migrate-to-blob.ts --db <database.db> --uploads <uploads 目录> --dry-run
$env:EDGEONE_PROJECT_ID="..."; $env:EDGEONE_BLOB_TOKEN="..."; node scripts/migrate-to-blob.ts --db <database.db> --uploads <uploads 目录>
```
