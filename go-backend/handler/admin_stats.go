package handler

import (
	"czlnav/model"
	"net/http"
)

func (d *Deps) GetStats(w http.ResponseWriter, r *http.Request) {
	var serviceCount, categoryCount int64
	var totalClicks int

	d.DB.Model(&model.Service{}).Count(&serviceCount)
	d.DB.Model(&model.Category{}).Count(&categoryCount)
	d.DB.Model(&model.Service{}).Select("COALESCE(SUM(clickCount), 0)").Scan(&totalClicks)

	success(w, map[string]any{
		"serviceCount":  serviceCount,
		"categoryCount": categoryCount,
		"totalClicks":   totalClicks,
	})
}
