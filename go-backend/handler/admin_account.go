package handler

import (
	"czlnav/pkg/oauth2"
	"net/http"
)

func (d *Deps) GetAccount(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*oauth2.CZLUser)
	success(w, user)
}

func (d *Deps) ChangePassword(w http.ResponseWriter, r *http.Request) {
	errorResponse(w, http.StatusBadRequest,
		"密码修改功能已迁移到 CZL Connect 平台，请前往 https://connect.czl.net 修改您的密码")
}
