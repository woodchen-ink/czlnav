package middleware

import (
	"context"
	"czlnav/pkg/cache"
	"czlnav/pkg/oauth2"
	"log"
	"net/http"
	"strings"
	"time"
)

func AdminAuth(c *cache.Cache, oauthClient *oauth2.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			accessToken, err := r.Cookie("access_token")
			if err != nil || accessToken.Value == "" {
				handleUnauthorized(w, r)
				return
			}

			cacheKey := "user:" + accessToken.Value
			if cached, ok := c.Get(cacheKey); ok {
				if user, ok := cached.(*oauth2.CZLUser); ok {
					ctx := context.WithValue(r.Context(), "user", user)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			user, err := oauthClient.GetUserInfo(accessToken.Value)
			if err != nil || user == nil {
				log.Printf("auth verification failed: %v", err)
				handleUnauthorized(w, r)
				return
			}

			c.Set(cacheKey, user, 10*time.Minute)
			ctx := context.WithValue(r.Context(), "user", user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func handleUnauthorized(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"success":false,"message":"Unauthorized","data":null}`))
		return
	}

	http.Redirect(w, r, "/admin/login", http.StatusFound)
}
