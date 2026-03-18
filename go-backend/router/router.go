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

func New(deps *handler.Deps) http.Handler {
	r := chi.NewRouter()

	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.StripSlashes)
	r.Use(chiMiddleware.NoCache)

	r.Get("/api/health", deps.Health)
	r.Get("/api/settings", deps.GetPublicSettings)
	r.Get("/api/public/home", deps.GetPublicHome)
	r.Get("/api/public/category/{slug}", deps.GetPublicCategory)
	r.Get("/api/live-search", deps.LiveSearch)
	r.Post("/api/services/{id}/click", deps.ClickService)

	r.Get("/api/auth/login", deps.AuthLogin)
	r.Get("/api/auth/callback", deps.AuthCallback)
	r.Post("/api/auth/logout", deps.AuthLogout)

	r.Group(func(ar chi.Router) {
		ar.Use(middleware.AdminAuth(deps.Cache, deps.OAuth))

		ar.Get("/api/admin/account", deps.GetAccount)
		ar.Put("/api/admin/account/password", deps.ChangePassword)
		ar.Get("/api/admin/cache", deps.GetCacheInfo)
		ar.Delete("/api/admin/cache", deps.ClearCache)
		ar.Get("/api/admin/categories", deps.ListCategories)
		ar.Post("/api/admin/categories", deps.CreateCategory)
		ar.Post("/api/admin/categories/reorder", deps.ReorderCategories)
		ar.Get("/api/admin/categories/{id}", deps.GetCategory)
		ar.Put("/api/admin/categories/{id}", deps.UpdateCategory)
		ar.Delete("/api/admin/categories/{id}", deps.DeleteCategory)
		ar.Get("/api/admin/services", deps.ListServices)
		ar.Post("/api/admin/services", deps.CreateService)
		ar.Post("/api/admin/services/reorder", deps.ReorderServices)
		ar.Get("/api/admin/services/{id}", deps.GetService)
		ar.Put("/api/admin/services/{id}", deps.UpdateService)
		ar.Delete("/api/admin/services/{id}", deps.DeleteService)
		ar.Get("/api/admin/settings", deps.GetAdminSettings)
		ar.Put("/api/admin/settings", deps.UpdateSettings)
		ar.Get("/api/admin/stats", deps.GetStats)
		ar.Post("/api/admin/upload", deps.UploadFile)
		ar.Post("/api/admin/fetch-site-info", deps.FetchSiteInfo)
		ar.Post("/api/admin/download-icon", deps.DownloadIcon)
	})

	if staticFileServer := fileServer("/static/", deps.Config.StaticDir); staticFileServer != nil {
		r.Mount("/static", staticFileServer)
	}

	if nextAssets := fileServer("/_next/", filepath.Join(deps.Config.FrontendDistDir, "_next")); nextAssets != nil {
		r.Mount("/_next", nextAssets)
	}

	if uploadFileServer := fileServer("/uploads/", deps.Config.UploadDir); uploadFileServer != nil {
		r.Mount("/uploads", uploadFileServer)
	}

	r.Get("/favicon.ico", deps.ServeFrontendAsset)
	r.Get("/logo.png", deps.ServeFrontendAsset)
	r.Get("/logo.svg", deps.ServeFrontendAsset)

	r.Get("/admin/login", deps.ServeAdminLogin)
	adminPageHandler := middleware.AdminAuth(deps.Cache, deps.OAuth)(http.HandlerFunc(deps.ServeAdminPage))
	r.Get("/admin", func(w http.ResponseWriter, r *http.Request) {
		adminPageHandler.ServeHTTP(w, r)
	})
	r.Get("/admin/*", func(w http.ResponseWriter, r *http.Request) {
		adminPath := strings.TrimPrefix(r.URL.Path, "/admin/")
		if filepath.Ext(adminPath) != "" || strings.Contains(adminPath, "__next") {
			deps.ServeFrontendAsset(w, r)
			return
		}
		adminPageHandler.ServeHTTP(w, r)
	})

	r.Get("/", deps.ServeHome)
	r.Get("/c/{slug}", deps.ServeCategory)
	r.Get("/c/{slug}/page/{page}", func(w http.ResponseWriter, r *http.Request) {
		page := chi.URLParam(r, "page")
		q := r.URL.Query()
		if _, err := strconv.Atoi(page); err == nil {
			q.Set("page", page)
			r.URL.RawQuery = q.Encode()
		}
		deps.ServeCategory(w, r)
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/_next/") || filepath.Ext(r.URL.Path) != "" {
			deps.ServeFrontendAsset(w, r)
			return
		}
		if strings.HasPrefix(r.URL.Path, "/admin/") && !strings.HasPrefix(r.URL.Path, "/admin/assets/") {
			deps.ServeAdminPage(w, r)
			return
		}
		http.NotFound(w, r)
	})

	return r
}

func fileServer(prefix, root string) http.Handler {
	if root == "" {
		return nil
	}
	if _, err := os.Stat(root); err != nil {
		return nil
	}

	fs := http.StripPrefix(strings.TrimRight(prefix, "/"), http.FileServer(http.Dir(root)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=300")
		fs.ServeHTTP(w, r)
	})
}
