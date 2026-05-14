package router

import (
	"czlnav/handler"
	"czlnav/middleware"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

// 路由总装: /api/* 全程禁缓存; 静态资源按路径区分长短缓存; HTML 与 sw.js 不缓存.
func New(deps *handler.Deps) http.Handler {
	r := chi.NewRouter()

	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.StripSlashes)

	r.Route("/api", func(ar chi.Router) {
		ar.Use(chiMiddleware.NoCache)

		ar.Get("/health", deps.Health)
		ar.Get("/settings", deps.GetPublicSettings)
		ar.Get("/public/home", deps.GetPublicHome)
		ar.Get("/public/category/{slug}", deps.GetPublicCategory)
		ar.Get("/live-search", deps.LiveSearch)
		ar.Post("/services/{id}/click", deps.ClickService)

		ar.Get("/auth/login", deps.AuthLogin)
		ar.Get("/auth/callback", deps.AuthCallback)
		ar.Post("/auth/logout", deps.AuthLogout)

		ar.Group(func(adminAPI chi.Router) {
			adminAPI.Use(middleware.AdminAuth(deps.Cache, deps.OAuth))

			adminAPI.Get("/admin/account", deps.GetAccount)
			adminAPI.Put("/admin/account/password", deps.ChangePassword)
			adminAPI.Get("/admin/cache", deps.GetCacheInfo)
			adminAPI.Delete("/admin/cache", deps.ClearCache)
			adminAPI.Get("/admin/categories", deps.ListCategories)
			adminAPI.Post("/admin/categories", deps.CreateCategory)
			adminAPI.Post("/admin/categories/reorder", deps.ReorderCategories)
			adminAPI.Get("/admin/categories/{id}", deps.GetCategory)
			adminAPI.Put("/admin/categories/{id}", deps.UpdateCategory)
			adminAPI.Delete("/admin/categories/{id}", deps.DeleteCategory)
			adminAPI.Get("/admin/services", deps.ListServices)
			adminAPI.Post("/admin/services", deps.CreateService)
			adminAPI.Post("/admin/services/reorder", deps.ReorderServices)
			adminAPI.Get("/admin/services/{id}", deps.GetService)
			adminAPI.Put("/admin/services/{id}", deps.UpdateService)
			adminAPI.Delete("/admin/services/{id}", deps.DeleteService)
			adminAPI.Get("/admin/settings", deps.GetAdminSettings)
			adminAPI.Put("/admin/settings", deps.UpdateSettings)
			adminAPI.Get("/admin/stats", deps.GetStats)
			adminAPI.Post("/admin/upload", deps.UploadFile)
			adminAPI.Post("/admin/fetch-site-info", deps.FetchSiteInfo)
			adminAPI.Post("/admin/download-icon", deps.DownloadIcon)
		})
	})

	// 内容哈希命名, 永久 immutable
	if nextAssets := cachedFileServer("/_next/", filepath.Join(deps.Config.FrontendDistDir, "_next"), cacheImmutable); nextAssets != nil {
		r.Mount("/_next", nextAssets)
	}

	// 名字不带哈希, 中等缓存
	if staticFileServer := cachedFileServer("/static/", deps.Config.StaticDir, cacheMedium); staticFileServer != nil {
		r.Mount("/static", staticFileServer)
	}

	// 用户上传, 短缓存
	if uploadFileServer := cachedFileServer("/uploads/", deps.Config.UploadDir, cacheShort); uploadFileServer != nil {
		r.Mount("/uploads", uploadFileServer)
	}

	r.Get("/favicon.ico", withCache(deps.ServeFrontendAsset, cacheMedium))
	r.Get("/logo.png", withCache(deps.ServeFrontendAsset, cacheMedium))
	r.Get("/logo.svg", withCache(deps.ServeFrontendAsset, cacheMedium))

	// Service Worker 入口: 永不缓存, 由 Go 注入版本号占位符
	r.Get("/sw.js", deps.ServeServiceWorker)

	r.Get("/admin/login", withHTMLNoCache(deps.ServeAdminLogin))
	adminPageHandler := middleware.AdminAuth(deps.Cache, deps.OAuth)(http.HandlerFunc(deps.ServeAdminPage))
	r.Get("/admin", withHTMLNoCache(func(w http.ResponseWriter, req *http.Request) {
		adminPageHandler.ServeHTTP(w, req)
	}))
	r.Get("/admin/*", func(w http.ResponseWriter, req *http.Request) {
		adminPath := strings.TrimPrefix(req.URL.Path, "/admin/")
		if filepath.Ext(adminPath) != "" || strings.Contains(adminPath, "__next") {
			deps.ServeFrontendAsset(w, req)
			return
		}
		setHTMLNoCache(w)
		adminPageHandler.ServeHTTP(w, req)
	})

	r.Get("/", withHTMLNoCache(deps.ServeHome))
	r.Get("/c/{slug}", withHTMLNoCache(deps.ServeCategory))
	r.Get("/c/{slug}/page/{page}", withHTMLNoCache(func(w http.ResponseWriter, req *http.Request) {
		page := chi.URLParam(req, "page")
		q := req.URL.Query()
		if _, err := strconv.Atoi(page); err == nil {
			q.Set("page", page)
			req.URL.RawQuery = q.Encode()
		}
		deps.ServeCategory(w, req)
	}))

	r.NotFound(func(w http.ResponseWriter, req *http.Request) {
		if strings.HasPrefix(req.URL.Path, "/_next/") || filepath.Ext(req.URL.Path) != "" {
			deps.ServeFrontendAsset(w, req)
			return
		}
		if strings.HasPrefix(req.URL.Path, "/admin/") && !strings.HasPrefix(req.URL.Path, "/admin/assets/") {
			setHTMLNoCache(w)
			adminPageHandler.ServeHTTP(w, req)
			return
		}
		http.NotFound(w, req)
	})

	return r
}

const (
	cacheImmutable = "public, max-age=31536000, immutable"
	cacheMedium    = "public, max-age=86400"
	cacheShort     = "public, max-age=3600"
)

// HTML 必须每次回服务端拿最新占位符注入结果, 不缓存
func setHTMLNoCache(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
}

func withHTMLNoCache(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setHTMLNoCache(w)
		h(w, r)
	}
}

func withCache(h http.HandlerFunc, cacheControl string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", cacheControl)
		h(w, r)
	}
}

// cachedFileServer 包一层 Cache-Control, 调用方按路径用途选 cacheControl
func cachedFileServer(prefix, root, cacheControl string) http.Handler {
	if root == "" {
		return nil
	}
	if _, err := os.Stat(root); err != nil {
		return nil
	}

	fs := http.StripPrefix(strings.TrimRight(prefix, "/"), http.FileServer(http.Dir(root)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", cacheControl)
		fs.ServeHTTP(w, r)
	})
}
