package handler

import (
	"czlnav/model"
	"net/http"
	"strings"
	"time"
)

type searchResult struct {
	ID           int     `json:"id"`
	Name         string  `json:"name"`
	URL          string  `json:"url"`
	Description  string  `json:"description"`
	Icon         *string `json:"icon"`
	ClickCount   int     `json:"clickCount"`
	CategoryID   int     `json:"categoryId"`
	CategoryName string  `json:"categoryName"`
	CategorySlug string  `json:"categorySlug"`
}

func (d *Deps) LiveSearch(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if query == "" {
		success(w, []any{})
		return
	}

	// Check cache
	cacheKey := "live-search:" + query
	if cached, ok := d.Cache.Get(cacheKey); ok {
		success(w, cached)
		return
	}

	var services []model.Service
	likeQuery := "%" + query + "%"
	d.DB.Where("name LIKE ? OR description LIKE ?", likeQuery, likeQuery).
		Order("sortOrder ASC").
		Limit(8).
		Find(&services)

	// Get category info for results
	results := make([]searchResult, 0, len(services))
	for _, s := range services {
		var cat model.Category
		d.DB.Select("name, slug").First(&cat, s.CategoryID)
		results = append(results, searchResult{
			ID:           s.ID,
			Name:         s.Name,
			URL:          s.URL,
			Description:  s.Description,
			Icon:         s.Icon,
			ClickCount:   s.ClickCount,
			CategoryID:   s.CategoryID,
			CategoryName: cat.Name,
			CategorySlug: cat.Slug,
		})
	}

	d.Cache.Set(cacheKey, results, 60*time.Second)
	success(w, results)
}
