package handler

import (
	"net/http"
	"time"
)

func (d *Deps) Health(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]any{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
