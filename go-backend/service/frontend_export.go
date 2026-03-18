package service

import (
	"czlnav/config"
	"log"
	"sync"

	"gorm.io/gorm"
)

// SSGService is retained as a lightweight compatibility layer for write handlers.
// Public pages now come from the exported Next.js frontend in frontend/out.
type SSGService struct {
	db  *gorm.DB
	cfg *config.Config
	mu  sync.Mutex
}

func NewSSGService(db *gorm.DB, cfg *config.Config) *SSGService {
	return &SSGService{
		db:  db,
		cfg: cfg,
	}
}

func (s *SSGService) BuildAll() {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Printf("frontend export rebuild skipped; rebuild the Next.js frontend separately when needed (source: %s)", s.cfg.FrontendDistDir)
}
