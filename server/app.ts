import { Router } from "./router";
import * as pub from "./handlers/public";
import * as auth from "./handlers/auth";
import * as categories from "./handlers/admin-categories";
import * as services from "./handlers/admin-services";
import * as settings from "./handlers/admin-settings";
import { upload } from "./handlers/admin-upload";
import { fetchSiteInfo, downloadIconHandler } from "./handlers/admin-site-info";

// /api/* 全部路由, 由 cloud-functions/api/[[default]].ts 承接
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
api.admin.post("/api/admin/categories", categories.create);
api.admin.post("/api/admin/categories/reorder", categories.reorder);
api.admin.get("/api/admin/categories/:id", categories.get);
api.admin.put("/api/admin/categories/:id", categories.update);
api.admin.delete("/api/admin/categories/:id", categories.remove);

api.admin.get("/api/admin/services", services.list);
api.admin.post("/api/admin/services", services.create);
api.admin.post("/api/admin/services/reorder", services.reorder);
api.admin.get("/api/admin/services/:id", services.get);
api.admin.put("/api/admin/services/:id", services.update);
api.admin.delete("/api/admin/services/:id", services.remove);

api.admin.get("/api/admin/settings", settings.get);
api.admin.put("/api/admin/settings", settings.update);
api.admin.get("/api/admin/stats", settings.stats);

api.admin.post("/api/admin/upload", upload);
api.admin.post("/api/admin/fetch-site-info", fetchSiteInfo);
api.admin.post("/api/admin/download-icon", downloadIconHandler);
