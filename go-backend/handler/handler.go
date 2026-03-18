package handler

import (
	"czlnav/config"
	"czlnav/pkg/cache"
	"czlnav/pkg/oauth2"
	"czlnav/service"

	"gorm.io/gorm"
)

// Deps holds all dependencies injected into handlers.
type Deps struct {
	DB         *gorm.DB
	Config     *config.Config
	Cache      *cache.Cache
	OAuth      *oauth2.Client
	SSGService *service.SSGService
}
