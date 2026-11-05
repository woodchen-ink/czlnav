import { Router } from "./router";
import * as pub from "./handlers/public";
import * as auth from "./handlers/auth";
import * as categories from "./handlers/admin-categories";
import * as services from "./handlers/admin-services";
import * as settings from "./handlers/admin-settings";
import { upload } from "./handlers/admin-upload";
import { fetchSiteInfo, downloadIconHandler } from "./handlers/admin-site-info";
import { publishAfter } from "./publish";

// /api/* 全部路由, 由 cloud-functions/api/[[default]].ts 承接.
// 公开端页面已构建期预渲染, 下列公开接口供后台读设置、本地 / CI 构建拉数据 (build-site-data --from-api) 使用;
// 改动公开内容的写接口用 publishAfter 包装, 成功后触发 CNB 重新构建发布.
export const api = new Router();

api.get("/api/health", pub.health);
api.get("/api/settings", pub.settings);
api.get("/api/public/home", pub.home);
api.get("/api/public/category/:slug", pub.category);
api.get("/api/live-search", pub.liveSearch);

api.get("/api/auth/login", auth.login);
api.get("/api/auth/callback", auth.callback);
api.post("/api/auth/logout", auth.logout);

api.admin.get("/api/admin/account", auth.account);
api.admin.put("/api/admin/account/password", auth.changePassword);

api.admin.get("/api/admin/categories", categories.list);
api.admin.post("/api/admin/categories", publishAfter(categories.create));
api.admin.post("/api/admin/categories/reorder", publishAfter(categories.reorder));
api.admin.get("/api/admin/categories/:id", categories.get);
api.admin.put("/api/admin/categories/:id", publishAfter(categories.update));
api.admin.delete("/api/admin/categories/:id", publishAfter(categories.remove));

api.admin.get("/api/admin/services", services.list);
api.admin.post("/api/admin/services", publishAfter(services.create));
api.admin.post("/api/admin/services/reorder", publishAfter(services.reorder));
api.admin.get("/api/admin/services/:id", services.get);
api.admin.put("/api/admin/services/:id", publishAfter(services.update));
api.admin.delete("/api/admin/services/:id", publishAfter(services.remove));

api.admin.get("/api/admin/settings", settings.get);
api.admin.put("/api/admin/settings", publishAfter(settings.update));
api.admin.get("/api/admin/stats", settings.stats);

api.admin.post("/api/admin/upload", upload);
api.admin.post("/api/admin/fetch-site-info", fetchSiteInfo);
api.admin.post("/api/admin/download-icon", downloadIconHandler);
