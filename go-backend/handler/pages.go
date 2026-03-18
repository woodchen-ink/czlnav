package handler

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (d *Deps) ServeHome(w http.ResponseWriter, r *http.Request) {
	d.serveHTMLFile(w, r, filepath.Join(d.Config.FrontendDistDir, "index.html"))
}

func (d *Deps) ServeCategory(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(chi.URLParam(r, "slug"))
	if slug == "" {
		http.NotFound(w, r)
		return
	}

	if pageParam := strings.TrimSpace(r.URL.Query().Get("page")); pageParam != "" {
		parsed, err := strconv.Atoi(pageParam)
		if err != nil || parsed < 1 {
			http.NotFound(w, r)
			return
		}
	}

	categoryShell := filepath.Join(d.Config.FrontendDistDir, "c", "index.html")
	if _, err := os.Stat(categoryShell); err == nil {
		d.serveHTMLFile(w, r, categoryShell)
		return
	}

	fallback := filepath.Join(d.Config.FrontendDistDir, "404", "index.html")
	if _, err := os.Stat(fallback); err == nil {
		d.serveHTMLFile(w, r, fallback)
		return
	}

	http.NotFound(w, r)
}

func (d *Deps) ServeAdminLogin(w http.ResponseWriter, r *http.Request) {
	d.serveAdminPath(w, r, "login")
}

func (d *Deps) ServeAdminPage(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/admin")
	path = strings.Trim(path, "/")
	if path == "" {
		path = "."
	}
	d.serveAdminPath(w, r, path)
}

func (d *Deps) ServeFrontendAsset(w http.ResponseWriter, r *http.Request) {
	rel := strings.TrimPrefix(filepath.Clean(r.URL.Path), string(filepath.Separator))
	if rel == "." || rel == "" || strings.HasPrefix(rel, "..") {
		http.NotFound(w, r)
		return
	}

	fullPath := d.resolveFrontendAssetPath(rel)
	if fullPath == "" {
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, fullPath)
}

func (d *Deps) serveAdminPath(w http.ResponseWriter, r *http.Request, rel string) {
	rel = filepath.Clean(rel)
	if rel == "." {
		rel = ""
	}
	if strings.HasPrefix(rel, "..") {
		http.NotFound(w, r)
		return
	}

	candidates := []string{
		filepath.Join(d.Config.AdminDistDir, rel, "index.html"),
		filepath.Join(d.Config.AdminDistDir, rel+".html"),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			d.serveHTMLFile(w, r, candidate)
			return
		}
	}

	http.NotFound(w, r)
}

func (d *Deps) serveHTMLFile(w http.ResponseWriter, r *http.Request, path string) {
	if _, err := os.Stat(path); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	http.ServeFile(w, r, path)
}

func (d *Deps) resolveFrontendAssetPath(rel string) string {
	direct := filepath.Join(d.Config.FrontendDistDir, filepath.FromSlash(rel))
	if _, err := os.Stat(direct); err == nil {
		return direct
	}

	dir := filepath.Dir(rel)
	base := filepath.Base(rel)

	if !strings.HasPrefix(base, "__next.") || filepath.Ext(base) != ".txt" {
		return ""
	}

	name := strings.TrimSuffix(base, ".txt")
	parts := strings.Split(name, ".")
	if len(parts) < 2 {
		return ""
	}

	prefix := parts[0] + "." + parts[1]
	rest := parts[2:]

	switch len(rest) {
	case 0:
		candidate := filepath.Join(d.Config.FrontendDistDir, filepath.FromSlash(dir), prefix+".txt")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	case 1:
		candidate := filepath.Join(d.Config.FrontendDistDir, filepath.FromSlash(dir), prefix, rest[0]+".txt")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	default:
		candidate := filepath.Join(
			d.Config.FrontendDistDir,
			filepath.FromSlash(dir),
			prefix,
			filepath.Join(rest[:len(rest)-1]...),
			rest[len(rest)-1]+".txt",
		)
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}

	return ""
}
