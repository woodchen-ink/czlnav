package handler

import (
	"encoding/json"
	"net/http"
)

type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

func jsonResponse(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func success(w http.ResponseWriter, data any, message ...string) {
	msg := "操作成功"
	if len(message) > 0 {
		msg = message[0]
	}
	jsonResponse(w, http.StatusOK, APIResponse{
		Success: true,
		Message: msg,
		Data:    data,
	})
}

func errorResponse(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, APIResponse{
		Success: false,
		Message: message,
		Data:    nil,
	})
}
