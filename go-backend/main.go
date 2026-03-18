package main

import (
	"czlnav/config"
	"czlnav/database"
	"czlnav/handler"
	"czlnav/pkg/cache"
	"czlnav/pkg/oauth2"
	"czlnav/router"
	"czlnav/service"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func main() {
	cfg := config.Load()

	seedDatabaseIfNeeded(cfg.DatabasePath, cfg.DatabaseSeedPath)
	ensureDir(cfg.UploadDir)
	ensureDir(cfg.DistDir)
	ensureDir(cfg.AdminDistDir)

	db := database.Init(cfg)
	cacheStore := cache.New()
	oauthClient := oauth2.NewClient(cfg)
	ssgService := service.NewSSGService(db, cfg)
	ssgService.BuildAll()

	deps := &handler.Deps{
		DB:         db,
		Config:     cfg,
		Cache:      cacheStore,
		OAuth:      oauthClient,
		SSGService: ssgService,
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router.New(deps),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       time.Duration(cfg.ReadTimeoutSeconds) * time.Second,
		WriteTimeout:      time.Duration(cfg.WriteTimeoutSeconds) * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("CZL Nav Go server listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}

func ensureDir(path string) {
	if path == "" {
		return
	}
	if err := os.MkdirAll(path, 0o755); err != nil {
		log.Fatalf("failed to create directory %s: %v", path, err)
	}
}

func seedDatabaseIfNeeded(databasePath, seedPath string) {
	if databasePath == "" || seedPath == "" {
		return
	}
	if _, err := os.Stat(databasePath); err == nil {
		return
	}
	if _, err := os.Stat(seedPath); err != nil {
		return
	}

	if err := os.MkdirAll(filepath.Dir(databasePath), 0o755); err != nil {
		log.Fatalf("failed to create database directory: %v", err)
	}

	data, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("failed to read seed database: %v", err)
	}
	if err := os.WriteFile(databasePath, data, 0o644); err != nil {
		log.Fatalf("failed to write seeded database: %v", err)
	}
}
