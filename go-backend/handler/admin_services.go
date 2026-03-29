package handler

import (
	"czlnav/model"
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

func (d *Deps) ListServices(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	categoryID, _ := strconv.Atoi(r.URL.Query().Get("categoryId"))

	if page < 1 {
		page = 1
	}

	query := d.DB.Model(&model.Service{})
	if categoryID > 0 {
		query = query.Where("categoryId = ?", categoryID)
	}

	var total int64
	query.Count(&total)

	var services []model.Service
	q := d.DB.Order("sortOrder ASC")
	if categoryID > 0 {
		q = q.Where("categoryId = ?", categoryID)
	}
	if pageSize > 0 {
		q = q.Offset((page - 1) * pageSize).Limit(pageSize)
	}
	q.Find(&services)

	// Add category names
	result := make([]model.ServiceWithCategory, 0, len(services))
	catCache := map[int]model.Category{}
	for _, s := range services {
		cat, ok := catCache[s.CategoryID]
		if !ok {
			d.DB.First(&cat, s.CategoryID)
			catCache[s.CategoryID] = cat
		}
		result = append(result, model.ServiceWithCategory{
			Service:      s,
			CategoryName: cat.Name,
			CategorySlug: cat.Slug,
		})
	}

	if pageSize > 0 {
		totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
		success(w, map[string]any{
			"data": result,
			"pagination": map[string]int{
				"current":  page,
				"pageSize": pageSize,
				"total":    int(total),
				"pages":    totalPages,
			},
		})
	} else {
		success(w, result)
	}
}

func (d *Deps) CreateService(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string  `json:"name"`
		URL         string  `json:"url"`
		Description string  `json:"description"`
		CategoryID  int     `json:"categoryId"`
		Icon        *string `json:"icon"`
		SortOrder   *int    `json:"sortOrder"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errorResponse(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	if input.Name == "" || input.URL == "" || input.Description == "" || input.CategoryID == 0 {
		errorResponse(w, http.StatusBadRequest, "名称、URL、描述和分类不能为空")
		return
	}

	// Verify category exists
	var cat model.Category
	if err := d.DB.First(&cat, input.CategoryID).Error; err != nil {
		errorResponse(w, http.StatusBadRequest, "分类不存在")
		return
	}

	sortOrder := 0
	if input.SortOrder != nil {
		sortOrder = *input.SortOrder
	} else {
		var maxSort int
		d.DB.Model(&model.Service{}).Where("categoryId = ?", input.CategoryID).
			Select("COALESCE(MAX(sortOrder), 0)").Scan(&maxSort)
		sortOrder = maxSort + 1
	}

	svc := model.Service{
		Name:        input.Name,
		URL:         input.URL,
		Description: input.Description,
		CategoryID:  input.CategoryID,
		Icon:        input.Icon,
		SortOrder:   sortOrder,
	}

	if err := d.DB.Create(&svc).Error; err != nil {
		errorResponse(w, http.StatusInternalServerError, "创建服务失败")
		return
	}

	d.invalidatePublicContentCache()
	go d.SSGService.BuildAll()
	success(w, model.ServiceWithCategory{
		Service:      svc,
		CategoryName: cat.Name,
		CategorySlug: cat.Slug,
	}, "创建服务成功")
}

func (d *Deps) GetService(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var svc model.Service
	if err := d.DB.First(&svc, id).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "服务不存在")
		return
	}
	var cat model.Category
	d.DB.First(&cat, svc.CategoryID)
	success(w, model.ServiceWithCategory{
		Service:      svc,
		CategoryName: cat.Name,
		CategorySlug: cat.Slug,
	})
}

func (d *Deps) UpdateService(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var svc model.Service
	if err := d.DB.First(&svc, id).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "服务不存在")
		return
	}

	var input map[string]any
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errorResponse(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	updates := map[string]any{}
	fieldMap := map[string]string{
		"name": "name", "url": "url", "description": "description",
		"icon": "icon", "categoryId": "categoryId", "sortOrder": "sortOrder",
	}
	for jsonKey, col := range fieldMap {
		if v, ok := input[jsonKey]; ok {
			updates[col] = v
		}
	}

	if len(updates) > 0 {
		d.DB.Model(&svc).Updates(updates)
	}

	d.DB.First(&svc, id)
	var cat model.Category
	d.DB.First(&cat, svc.CategoryID)

	d.invalidatePublicContentCache()
	go d.SSGService.BuildAll()
	success(w, model.ServiceWithCategory{
		Service:      svc,
		CategoryName: cat.Name,
		CategorySlug: cat.Slug,
	}, "更新服务成功")
}

func (d *Deps) DeleteService(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var svc model.Service
	if err := d.DB.First(&svc, id).Error; err != nil {
		errorResponse(w, http.StatusNotFound, "服务不存在")
		return
	}

	if svc.Icon != nil {
		deleteIconFile(d.Config.UploadDir, *svc.Icon)
	}

	d.DB.Delete(&svc)
	d.invalidatePublicContentCache()
	go d.SSGService.BuildAll()
	success(w, nil, "删除服务成功")
}

func (d *Deps) ReorderServices(w http.ResponseWriter, r *http.Request) {
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
		d.DB.Model(&model.Service{}).Where("id = ?", u.ID).Update("sortOrder", u.SortOrder)
	}

	d.invalidatePublicContentCache()
	go d.SSGService.BuildAll()
	success(w, nil, "批量更新排序成功")
}
