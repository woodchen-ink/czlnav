package handler

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"
)

func (d *Deps) AuthLogin(w http.ResponseWriter, r *http.Request) {
	if d.Config.CZLConnectClientID == "" || d.Config.CZLConnectClientSecret == "" {
		http.Redirect(w, r, "/admin/login?error=missing_oauth_config", http.StatusFound)
		return
	}

	// Generate random state for CSRF protection
	stateBytes := make([]byte, 16)
	rand.Read(stateBytes)
	state := hex.EncodeToString(stateBytes)

	// Set state cookie (10 min TTL)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction(d.Config.AppURL),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600,
	})

	authURL := d.OAuth.GetAuthURL(state)
	http.Redirect(w, r, authURL, http.StatusFound)
}

func (d *Deps) AuthCallback(w http.ResponseWriter, r *http.Request) {
	// Check for error from OAuth provider
	if errParam := r.URL.Query().Get("error"); errParam != "" {
		http.Redirect(w, r, "/admin/login?error=oauth_"+errParam, http.StatusFound)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Redirect(w, r, "/admin/login?error=no_code", http.StatusFound)
		return
	}

	// Validate state
	state := r.URL.Query().Get("state")
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || stateCookie.Value != state {
		http.Redirect(w, r, "/admin/login?error=invalid_state", http.StatusFound)
		return
	}

	// Delete state cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "oauth_state",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	// Exchange code for token
	token, err := d.OAuth.ExchangeCodeForToken(code)
	if err != nil {
		http.Redirect(w, r, "/admin/login?error=token_exchange_failed", http.StatusFound)
		return
	}

	// Verify we can get user info
	_, err = d.OAuth.GetUserInfo(token.AccessToken)
	if err != nil {
		http.Redirect(w, r, "/admin/login?error=get_user_failed", http.StatusFound)
		return
	}

	secure := isProduction(d.Config.AppURL)

	// Set access token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    token.AccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   token.ExpiresIn,
	})

	// Set refresh token cookie (30 days)
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    token.RefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   30 * 24 * 60 * 60,
	})

	http.Redirect(w, r, "/admin", http.StatusFound)
}

func (d *Deps) AuthLogout(w http.ResponseWriter, r *http.Request) {
	for _, name := range []string{"access_token", "refresh_token"} {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			Expires:  time.Unix(0, 0),
			HttpOnly: true,
		})
	}
	success(w, nil, "登出成功")
}

func isProduction(appURL string) bool {
	return len(appURL) > 5 && appURL[:5] == "https"
}
