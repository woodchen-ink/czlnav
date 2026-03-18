package handler

import "net/http"

func (d *Deps) GetCacheInfo(w http.ResponseWriter, r *http.Request) {
	keys := d.Cache.Keys()
	success(w, map[string]any{
		"size":      d.Cache.Size(),
		"totalKeys": len(keys),
		"keys":      keys,
	})
}

func (d *Deps) ClearCache(w http.ResponseWriter, r *http.Request) {
	d.Cache.Clear()
	success(w, map[string]string{"message": "缓存清理成功"})
}
