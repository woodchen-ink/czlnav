package cache

import (
	"strings"
	"sync"
	"time"
)

type item struct {
	value     any
	expiresAt time.Time
}

type Cache struct {
	mu    sync.RWMutex
	items map[string]item
}

func New() *Cache {
	c := &Cache{items: make(map[string]item)}
	go c.cleanup()
	return c
}

func (c *Cache) Set(key string, value any, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = item{value: value, expiresAt: time.Now().Add(ttl)}
}

func (c *Cache) Get(key string) (any, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	it, ok := c.items[key]
	if !ok || time.Now().After(it.expiresAt) {
		return nil, false
	}
	return it.value, true
}

func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

func (c *Cache) DeletePrefix(prefix string) int {
	c.mu.Lock()
	defer c.mu.Unlock()

	deleted := 0
	for key := range c.items {
		if strings.HasPrefix(key, prefix) {
			delete(c.items, key)
			deleted++
		}
	}

	return deleted
}

func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items = make(map[string]item)
}

func (c *Cache) Keys() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	now := time.Now()
	keys := make([]string, 0, len(c.items))
	for k, it := range c.items {
		if now.Before(it.expiresAt) {
			keys = append(keys, k)
		}
	}
	return keys
}

func (c *Cache) Size() int {
	return len(c.Keys())
}

func (c *Cache) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, it := range c.items {
			if now.After(it.expiresAt) {
				delete(c.items, k)
			}
		}
		c.mu.Unlock()
	}
}
