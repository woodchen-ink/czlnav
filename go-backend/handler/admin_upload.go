package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var allowedMimeTypes = map[string]string{
	"image/jpeg":    "jpg",
	"image/png":     "png",
	"image/gif":     "gif",
	"image/webp":    "webp",
	"image/svg+xml": "svg",
	"image/x-icon":  "ico",
}

const maxUploadSize = 5 * 1024 * 1024 // 5MB

func (d *Deps) UploadFile(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		errorResponse(w, http.StatusBadRequest, "文件大小超过5MB限制")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "请选择要上传的文件")
		return
	}
	defer file.Close()

	// Validate content type
	contentType := header.Header.Get("Content-Type")
	ext, ok := allowedMimeTypes[contentType]
	if !ok {
		errorResponse(w, http.StatusBadRequest, "不支持的文件类型")
		return
	}

	// Generate filename
	randBytes := make([]byte, 4)
	rand.Read(randBytes)
	filename := fmt.Sprintf("icon_%d_%s.%s", time.Now().UnixMilli(), hex.EncodeToString(randBytes), ext)

	// Ensure upload directory exists
	iconDir := filepath.Join(d.Config.UploadDir, "icons")
	os.MkdirAll(iconDir, 0755)

	// Save file
	destPath := filepath.Join(iconDir, filename)
	dest, err := os.Create(destPath)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "保存文件失败")
		return
	}
	defer dest.Close()

	if _, err := io.Copy(dest, file); err != nil {
		errorResponse(w, http.StatusInternalServerError, "保存文件失败")
		return
	}

	urlPath := "/uploads/icons/" + filename
	success(w, map[string]string{
		"url":  urlPath,
		"path": urlPath,
	}, "文件上传成功")
}

func deleteIconFile(uploadDir, iconPath string) {
	if iconPath == "" {
		return
	}
	// Strip /uploads/ prefix to get relative path
	relPath := strings.TrimPrefix(iconPath, "/uploads/")
	fullPath := filepath.Join(uploadDir, relPath)
	os.Remove(fullPath)
}
