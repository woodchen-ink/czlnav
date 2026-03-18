package handler

import (
	"czlnav/model"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

const publicCategoryPageSize = 24

type PublicHomePayload struct {
	Categories []model.Category `json:"categories"`
}

type PublicCategoryPayload struct {
	Category    model.Category  `json:"category"`
	Services    []model.Service `json:"services"`
	CurrentPage int             `json:"currentPage"`
	TotalPages  int             `json:"totalPages"`
	TotalCount  int             `json:"totalCount"`
}

func (d *Deps) GetPublicHome(w http.ResponseWriter, r *http.Request) {
	var categories []model.Category
	d.DB.Preload("Services", func(db *gorm.DB) *gorm.DB {
		return db.Order("sortOrder ASC").Order("id DESC")
	}).Order("sortOrder ASC").Find(&categories)

	success(w, PublicHomePayload{
		Categories: categories,
	})
}

func (d *Deps) GetPublicCategory(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(chi.URLParam(r, "slug"))
	if slug == "" {
		errorResponse(w, http.StatusBadRequest, "分类 slug 不能为空")
		return
	}

	page := 1
	if rawPage := strings.TrimSpace(r.URL.Query().Get("page")); rawPage != "" {
		parsed, err := strconv.Atoi(rawPage)
		if err != nil || parsed < 1 {
			errorResponse(w, http.StatusBadRequest, "无效的页码")
			return
		}
		page = parsed
	}

	var category model.Category
	if err := d.DB.Where("slug = ?", slug).First(&category).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "分类不存在")
		return
	}

	var totalCount int64
	d.DB.Model(&model.Service{}).Where("categoryId = ?", category.ID).Count(&totalCount)

	totalPages := int(math.Ceil(float64(totalCount) / float64(publicCategoryPageSize)))
	if totalPages == 0 {
		totalPages = 1
	}
	if page > totalPages {
		page = totalPages
	}

	var services []model.Service
	d.DB.Where("categoryId = ?", category.ID).
		Order("sortOrder ASC").
		Order("id DESC").
		Offset((page - 1) * publicCategoryPageSize).
		Limit(publicCategoryPageSize).
		Find(&services)

	success(w, PublicCategoryPayload{
		Category:    category,
		Services:    services,
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalCount:  int(totalCount),
	})
}
