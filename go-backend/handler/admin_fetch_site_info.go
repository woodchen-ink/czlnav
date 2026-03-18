package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

func (d *Deps) FetchSiteInfo(w http.ResponseWriter, r *http.Request) {
	var input struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.URL == "" {
		errorResponse(w, http.StatusBadRequest, "请提供URL")
		return
	}

	client := &http.Client{Timeout: 15 * time.Second}

	var body string
	var err error
	for attempt := 0; attempt < 3; attempt++ {
		var resp *http.Response
		resp, err = client.Get(input.URL)
		if err == nil {
			defer resp.Body.Close()
			bodyBytes, _ := io.ReadAll(resp.Body)
			body = string(bodyBytes)
			break
		}
		time.Sleep(time.Duration(attempt+1) * time.Second)
	}
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "无法访问该网站")
		return
	}

	// Extract title
	title := extractMeta(body, `<title[^>]*>([^<]+)</title>`)
	if title == "" {
		title = extractMetaContent(body, "og:title")
	}

	// Extract description
	description := extractMetaContent(body, "description")
	if description == "" {
		description = extractMetaContent(body, "og:description")
	}

	// Try to download favicon
	parsedURL, _ := url.Parse(input.URL)
	iconURL := ""

	// Try link rel="icon" first
	iconHref := extractLinkHref(body, "icon")
	if iconHref == "" {
		iconHref = extractLinkHref(body, "shortcut icon")
	}
	if iconHref != "" {
		if strings.HasPrefix(iconHref, "//") {
			iconHref = parsedURL.Scheme + ":" + iconHref
		} else if strings.HasPrefix(iconHref, "/") {
			iconHref = parsedURL.Scheme + "://" + parsedURL.Host + iconHref
		} else if !strings.HasPrefix(iconHref, "http") {
			iconHref = parsedURL.Scheme + "://" + parsedURL.Host + "/" + iconHref
		}
		iconURL = iconHref
	}

	// Fallback to /favicon.ico
	if iconURL == "" {
		iconURL = parsedURL.Scheme + "://" + parsedURL.Host + "/favicon.ico"
	}

	// Download and save icon
	localIcon := ""
	if iconURL != "" {
		localIcon = downloadAndSaveIcon(client, iconURL, d.Config.UploadDir, parsedURL.Host)
	}

	success(w, map[string]string{
		"title":       title,
		"description": description,
		"icon":        localIcon,
	})
}

func (d *Deps) DownloadIcon(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IconURL string `json:"iconUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.IconURL == "" {
		errorResponse(w, http.StatusBadRequest, "请提供图标URL")
		return
	}

	parsedURL, _ := url.Parse(input.IconURL)
	client := &http.Client{Timeout: 15 * time.Second}
	localURL := downloadAndSaveIcon(client, input.IconURL, d.Config.UploadDir, parsedURL.Host)
	if localURL == "" {
		errorResponse(w, http.StatusBadRequest, "下载图标失败")
		return
	}

	success(w, map[string]string{"localUrl": localURL})
}

func downloadAndSaveIcon(client *http.Client, iconURL, uploadDir, hostname string) string {
	resp, err := client.Get(iconURL)
	if err != nil || resp.StatusCode != 200 {
		return ""
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil || len(data) == 0 {
		return ""
	}

	// Detect extension from content type or URL
	ext := "png"
	ct := resp.Header.Get("Content-Type")
	switch {
	case strings.Contains(ct, "svg"):
		ext = "svg"
	case strings.Contains(ct, "icon") || strings.Contains(ct, "x-icon"):
		ext = "ico"
	case strings.Contains(ct, "gif"):
		ext = "gif"
	case strings.Contains(ct, "webp"):
		ext = "webp"
	case strings.Contains(ct, "jpeg") || strings.Contains(ct, "jpg"):
		ext = "jpg"
	case strings.Contains(ct, "png"):
		ext = "png"
	default:
		// Try from URL
		if strings.HasSuffix(iconURL, ".svg") {
			ext = "svg"
		} else if strings.HasSuffix(iconURL, ".ico") {
			ext = "ico"
		}
	}

	iconDir := filepath.Join(uploadDir, "icons")
	os.MkdirAll(iconDir, 0755)

	randBytes := make([]byte, 4)
	rand.Read(randBytes)
	filename := fmt.Sprintf("%s_%d_%s.%s", sanitizeHostname(hostname), time.Now().UnixMilli(), hex.EncodeToString(randBytes), ext)
	destPath := filepath.Join(iconDir, filename)

	if err := os.WriteFile(destPath, data, 0644); err != nil {
		return ""
	}

	return "/uploads/icons/" + filename
}

func sanitizeHostname(host string) string {
	host = strings.ReplaceAll(host, ":", "_")
	host = strings.ReplaceAll(host, ".", "_")
	return host
}

func extractMeta(html, pattern string) string {
	re := regexp.MustCompile(`(?i)` + pattern)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return ""
}

func extractMetaContent(html, name string) string {
	patterns := []string{
		fmt.Sprintf(`(?i)<meta[^>]*(?:name|property)=["']%s["'][^>]*content=["']([^"']+)["']`, regexp.QuoteMeta(name)),
		fmt.Sprintf(`(?i)<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']%s["']`, regexp.QuoteMeta(name)),
	}
	for _, p := range patterns {
		if val := extractMeta(html, p); val != "" {
			return val
		}
	}
	return ""
}

func extractLinkHref(html, rel string) string {
	pattern := fmt.Sprintf(`(?i)<link[^>]*rel=["'](?:[^"']*\s)?%s(?:\s[^"']*)?["'][^>]*href=["']([^"']+)["']`, regexp.QuoteMeta(rel))
	if val := extractMeta(html, pattern); val != "" {
		return val
	}
	// Try reversed order
	pattern = fmt.Sprintf(`(?i)<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:[^"']*\s)?%s(?:\s[^"']*)?["']`, regexp.QuoteMeta(rel))
	return extractMeta(html, pattern)
}
