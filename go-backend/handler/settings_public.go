package handler

import (
	"czlnav/model"
	"net/http"
)

func (d *Deps) GetPublicSettings(w http.ResponseWriter, r *http.Request) {
	settings := d.loadSettings()
	success(w, settings)
}

func (d *Deps) loadSettings() map[string]string {
	var records []model.Setting
	d.DB.Find(&records)

	result := map[string]string{
		"siteName":        "CZL导航",
		"siteDescription": "一个导航站,包含AI, 国际快递, PDF工具, 图片在线压缩等等工具的导航站",
		"statisticsCode":  "",
		"seoTitle":        "",
		"seoKeywords":     "",
		"seoDescription":  "",
	}

	for _, s := range records {
		result[s.Key] = s.Value
	}

	return result
}
