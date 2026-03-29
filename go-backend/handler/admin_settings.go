package handler

import (
	"czlnav/model"
	"encoding/json"
	"net/http"
	"time"
)

func (d *Deps) GetAdminSettings(w http.ResponseWriter, r *http.Request) {
	settings := d.getCachedSettings()
	success(w, settings)
}

func (d *Deps) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var input map[string]string
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errorResponse(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	now := time.Now()
	for key, value := range input {
		var existing model.Setting
		result := d.DB.Where("`key` = ?", key).First(&existing)
		if result.Error != nil {
			// Create new
			d.DB.Create(&model.Setting{
				Key:       key,
				Value:     value,
				CreatedAt: model.FlexTime{Time: now},
				UpdatedAt: model.FlexTime{Time: now},
			})
		} else {
			// Update existing
			d.DB.Model(&existing).Updates(map[string]any{"value": value, "updatedAt": now})
		}
	}

	d.invalidateSettingsCache()
	go d.SSGService.BuildAll()
	success(w, nil, "设置更新成功")
}
