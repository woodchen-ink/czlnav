package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Env                    string
	AppURL                 string
	Port                   string
	DatabasePath           string
	DatabaseSeedPath       string
	CZLConnectClientID     string
	CZLConnectClientSecret string
	AuthCallbackURL        string
	UploadDir              string
	FrontendDistDir        string
	DistDir                string
	AdminDistDir           string
	StaticDir              string
	ReadTimeoutSeconds     int
	WriteTimeoutSeconds    int
}

func Load() *Config {
	loadDotEnvFiles(".env", filepath.Join("..", ".env"))

	appURL := getEnv("APP_URL", "http://localhost:3000")
	appURL = strings.TrimRight(appURL, "/")

	return &Config{
		Env:                    getEnv("APP_ENV", getEnv("GO_ENV", getEnv("NODE_ENV", "development"))),
		AppURL:                 appURL,
		Port:                   getEnv("PORT", "3000"),
		DatabasePath:           cleanPath(getEnv("DATABASE_PATH", defaultDatabasePath())),
		DatabaseSeedPath:       cleanPath(getEnv("DATABASE_SEED_PATH", defaultDatabaseSeedPath())),
		CZLConnectClientID:     getEnv("CZL_CONNECT_CLIENT_ID", ""),
		CZLConnectClientSecret: getEnv("CZL_CONNECT_CLIENT_SECRET", ""),
		AuthCallbackURL:        getEnv("AUTH_CALLBACK_URL", appURL+"/api/auth/callback"),
		UploadDir:              cleanPath(getEnv("UPLOAD_DIR", defaultUploadsPath())),
		FrontendDistDir:        cleanPath(getEnv("FRONTEND_DIST_DIR", defaultFrontendDistPath())),
		DistDir:                cleanPath(getEnv("DIST_DIR", "dist")),
		AdminDistDir:           cleanPath(getEnv("ADMIN_DIST_DIR", defaultAdminFrontendDistPath())),
		StaticDir:              cleanPath(getEnv("STATIC_DIR", "static")),
		ReadTimeoutSeconds:     getEnvInt("READ_TIMEOUT_SECONDS", 15),
		WriteTimeoutSeconds:    getEnvInt("WRITE_TIMEOUT_SECONDS", 30),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}

	parsed := 0
	for _, r := range value {
		if r < '0' || r > '9' {
			return defaultValue
		}
		parsed = parsed*10 + int(r-'0')
	}

	if parsed <= 0 {
		return defaultValue
	}

	return parsed
}

func defaultDatabasePath() string {
	candidates := []string{
		filepath.Join("..", "prisma", "data.db"),
		filepath.Join("prisma", "data.db"),
		filepath.Join("data", "database.db"),
	}

	return firstExistingPath(candidates, filepath.Join("data", "database.db"))
}

func defaultUploadsPath() string {
	candidates := []string{
		filepath.Join("..", "public", "uploads"),
		filepath.Join("public", "uploads"),
		"uploads",
	}

	return firstExistingPath(candidates, "uploads")
}

func defaultDatabaseSeedPath() string {
	candidates := []string{
		filepath.Join("..", "prisma", "data.db"),
		filepath.Join("prisma", "data.db"),
		filepath.Join("seed", "database.db"),
	}

	return firstExistingPath(candidates, "")
}

func defaultFrontendDistPath() string {
	candidates := []string{
		filepath.Join("..", "frontend", "out"),
		filepath.Join("frontend", "out"),
	}

	return firstExistingPath(candidates, filepath.Join("..", "frontend", "out"))
}

func defaultAdminFrontendDistPath() string {
	candidates := []string{
		filepath.Join("..", "frontend", "out", "admin"),
		filepath.Join("frontend", "out", "admin"),
	}

	return firstExistingPath(candidates, filepath.Join("..", "frontend", "out", "admin"))
}

func firstExistingPath(candidates []string, fallback string) string {
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return fallback
}

func cleanPath(path string) string {
	if strings.TrimSpace(path) == "" {
		return ""
	}
	return filepath.Clean(path)
}

func loadDotEnvFiles(paths ...string) {
	for _, path := range paths {
		loadDotEnvFile(path)
	}
}

func loadDotEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		if strings.HasPrefix(line, "export ") {
			line = strings.TrimSpace(strings.TrimPrefix(line, "export "))
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"`)
		value = strings.Trim(value, `'`)

		if key == "" || os.Getenv(key) != "" {
			continue
		}

		_ = os.Setenv(key, value)
	}
}
