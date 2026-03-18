package handler

import (
	"czlnav/model"
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func (d *Deps) ListCategories(w http.ResponseWriter, r *http.Request) {
	var categories []model.Category
	d.DB.Preload("Services", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "categoryId")
	}).Order("sortOrder ASC").Find(&categories)
	success(w, categories)
}

func (d *Deps) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name           string  `json:"name"`
		Slug           string  `json:"slug"`
		Description    *string `json:"description"`
		Icon           *string `json:"icon"`
		SortOrder      *int    `json:"sortOrder"`
		SeoTitle       *string `json:"seoTitle"`
		SeoDescription *string `json:"seoDescription"`
		SeoKeywords    *string `json:"seoKeywords"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errorResponse(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	if input.Name == "" || input.Slug == "" {
		errorResponse(w, http.StatusBadRequest, "名称和slug不能为空")
		return
	}

	slugRegex := regexp.MustCompile(`^[a-z0-9-]+$`)
	if !slugRegex.MatchString(input.Slug) {
		errorResponse(w, http.StatusBadRequest, "slug格式无效，只能包含小写字母、数字和连字符")
		return
	}

	// Check uniqueness
	var count int64
	d.DB.Model(&model.Category{}).Where("name = ? OR slug = ?", input.Name, input.Slug).Count(&count)
	if count > 0 {
		errorResponse(w, http.StatusBadRequest, "分类名称或slug已存在")
		return
	}

	// Auto sort order
	sortOrder := 0
	if input.SortOrder != nil {
		sortOrder = *input.SortOrder
	} else {
		var maxSort int
		d.DB.Model(&model.Category{}).Select("COALESCE(MAX(sortOrder), 0)").Scan(&maxSort)
		sortOrder = maxSort + 10
	}

	cat := model.Category{
		Name:           input.Name,
		Slug:           input.Slug,
		Description:    input.Description,
		Icon:           input.Icon,
		SortOrder:      sortOrder,
		SeoTitle:       input.SeoTitle,
		SeoDescription: input.SeoDescription,
		SeoKeywords:    input.SeoKeywords,
	}

	if err := d.DB.Create(&cat).Error; err != nil {
		errorResponse(w, http.StatusInternalServerError, "创建分类失败")
		return
	}

	go d.SSGService.BuildAll()
	success(w, cat, "创建分类成功")
}

func (d *Deps) GetCategory(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var cat model.Category
	if err := d.DB.First(&cat, id).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "分类不存在")
		return
	}
	success(w, cat)
}

func (d *Deps) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var cat model.Category
	if err := d.DB.First(&cat, id).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "分类不存在")
		return
	}

	var input map[string]any
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errorResponse(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	// Validate slug if provided
	if slug, ok := input["slug"].(string); ok {
		slugRegex := regexp.MustCompile(`^[a-z0-9-]+$`)
		if !slugRegex.MatchString(slug) {
			errorResponse(w, http.StatusBadRequest, "slug格式无效")
			return
		}
		// Check uniqueness excluding current
		var count int64
		d.DB.Model(&model.Category{}).Where("slug = ? AND id != ?", slug, id).Count(&count)
		if count > 0 {
			errorResponse(w, http.StatusBadRequest, "slug已被其他分类使用")
			return
		}
	}

	if name, ok := input["name"].(string); ok {
		var count int64
		d.DB.Model(&model.Category{}).Where("name = ? AND id != ?", name, id).Count(&count)
		if count > 0 {
			errorResponse(w, http.StatusBadRequest, "名称已被其他分类使用")
			return
		}
	}

	// Map fields
	updates := map[string]any{}
	fieldMap := map[string]string{
		"name": "name", "slug": "slug", "description": "description",
		"icon": "icon", "sortOrder": "sortOrder",
		"seoTitle": "seoTitle", "seoDescription": "seoDescription", "seoKeywords": "seoKeywords",
	}
	for jsonKey, col := range fieldMap {
		if v, ok := input[jsonKey]; ok {
			updates[col] = v
		}
	}

	if len(updates) > 0 {
		d.DB.Model(&cat).Updates(updates)
	}

	d.DB.First(&cat, id)
	go d.SSGService.BuildAll()
	success(w, cat, "更新分类成功")
}

func (d *Deps) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var cat model.Category
	if err := d.DB.First(&cat, id).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "分类不存在")
		return
	}

	// Delete icon file if exists
	if cat.Icon != nil {
		deleteIconFile(d.Config.UploadDir, *cat.Icon)
	}

	d.DB.Delete(&cat)
	go d.SSGService.BuildAll()
	success(w, nil, "删除分类成功")
}

func (d *Deps) ReorderCategories(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Updates []struct {
			ID        int `json:"id"`
			SortOrder int `json:"sortOrder"`
		} `json:"updates"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errorResponse(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	for _, u := range input.Updates {
		d.DB.Model(&model.Category{}).Where("id = ?", u.ID).Update("sortOrder", u.SortOrder)
	}

	go d.SSGService.BuildAll()
	success(w, nil, "批量更新排序成功")
}
