package handler

import (
	"strconv"
	"time"
)

const (
	publicSettingsCacheKey    = "public:settings"
	publicHomeCacheKey        = "public:home"
	publicCategoryCachePrefix = "public:category:"
	liveSearchCachePrefix     = "live-search:"

	publicSettingsCacheTTL = 10 * time.Minute
	publicHomeCacheTTL     = 5 * time.Minute
	publicCategoryCacheTTL = 5 * time.Minute
)

// getCachedSettings returns public settings from cache or reloads them from storage.
func (d *Deps) getCachedSettings() map[string]string {
	if cached, ok := d.Cache.Get(publicSettingsCacheKey); ok {
		if settings, ok := cached.(map[string]string); ok {
			return settings
		}
		d.Cache.Delete(publicSettingsCacheKey)
	}

	settings := d.loadSettings()
	d.Cache.Set(publicSettingsCacheKey, settings, publicSettingsCacheTTL)
	return settings
}

// getCachedHomePayload returns the cached home payload when available.
func (d *Deps) getCachedHomePayload() (PublicHomePayload, bool) {
	if cached, ok := d.Cache.Get(publicHomeCacheKey); ok {
		if payload, ok := cached.(PublicHomePayload); ok {
			return payload, true
		}
		d.Cache.Delete(publicHomeCacheKey)
	}

	return PublicHomePayload{}, false
}

// cacheHomePayload stores the assembled home payload for repeated public reads.
func (d *Deps) cacheHomePayload(payload PublicHomePayload) {
	d.Cache.Set(publicHomeCacheKey, payload, publicHomeCacheTTL)
}

// getCachedCategoryPayload returns the cached category payload for a slug/page pair.
func (d *Deps) getCachedCategoryPayload(slug string, page int) (PublicCategoryPayload, bool) {
	cacheKey := publicCategoryCacheKey(slug, page)
	if cached, ok := d.Cache.Get(cacheKey); ok {
		if payload, ok := cached.(PublicCategoryPayload); ok {
			return payload, true
		}
		d.Cache.Delete(cacheKey)
	}

	return PublicCategoryPayload{}, false
}

// cacheCategoryPayload stores the assembled category payload for later requests.
func (d *Deps) cacheCategoryPayload(slug string, page int, payload PublicCategoryPayload) {
	d.Cache.Set(publicCategoryCacheKey(slug, page), payload, publicCategoryCacheTTL)
}

// invalidatePublicContentCache clears public list, category and search caches after content changes.
func (d *Deps) invalidatePublicContentCache() {
	d.Cache.Delete(publicHomeCacheKey)
	d.Cache.DeletePrefix(publicCategoryCachePrefix)
	d.Cache.DeletePrefix(liveSearchCachePrefix)
}

// invalidateSettingsCache clears public settings cache after settings writes.
func (d *Deps) invalidateSettingsCache() {
	d.Cache.Delete(publicSettingsCacheKey)
}

// publicCategoryCacheKey builds a stable cache key for category pages.
func publicCategoryCacheKey(slug string, page int) string {
	return publicCategoryCachePrefix + slug + ":page:" + strconv.Itoa(page)
}
