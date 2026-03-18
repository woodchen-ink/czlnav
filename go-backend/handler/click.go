package handler

import (
	"czlnav/model"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func (d *Deps) ClickService(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "无效的服务ID")
		return
	}

	result := d.DB.Model(&model.Service{}).Where("id = ?", id).
		UpdateColumn("clickCount", gorm.Expr("clickCount + 1"))
	if result.Error != nil {
		errorResponse(w, http.StatusInternalServerError, "更新点击数失败")
		return
	}

	var svc model.Service
	d.DB.Select("clickCount").First(&svc, id)
	success(w, map[string]int{"clickCount": svc.ClickCount})
}
