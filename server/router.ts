import { HttpError, fail } from "./http";
import { requireAdmin, type AdminUser } from "./auth/session";
import type { Env } from "./env";

export interface RequestContext {
  request: Request;
  url: URL;
  params: Record<string, string>;
  env: Env;
  user: AdminUser | null;
}

export type Handler = (ctx: RequestContext) => Promise<Response> | Response;

interface Route {
  method: string;
  segments: string[];
  admin: boolean;
  handler: Handler;
}

// 极简路由: 只支持静态段与 :param 段, 足够覆盖本项目的 /api/* 契约.
export class Router {
  private routes: Route[] = [];

  get = (path: string, handler: Handler) => this.add("GET", path, handler, false);
  post = (path: string, handler: Handler) => this.add("POST", path, handler, false);

  admin = {
    get: (path: string, handler: Handler) => this.add("GET", path, handler, true),
    post: (path: string, handler: Handler) => this.add("POST", path, handler, true),
    put: (path: string, handler: Handler) => this.add("PUT", path, handler, true),
    delete: (path: string, handler: Handler) => this.add("DELETE", path, handler, true),
  };

  private add(method: string, path: string, handler: Handler, admin: boolean) {
    this.routes.push({ method, segments: split(path), admin, handler });
  }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const segments = split(url.pathname);
    const method = request.method === "HEAD" ? "GET" : request.method;

    let pathMatched = false;
    for (const route of this.routes) {
      const params = match(route.segments, segments);
      if (!params) continue;
      pathMatched = true;
      if (route.method !== method) continue;

      try {
        const ctx: RequestContext = { request, url, params, env, user: null };
        if (route.admin) {
          const auth = await requireAdmin(request, env);
          if (!auth.user) return fail(401, "Unauthorized");
          ctx.user = auth.user;
          const res = await route.handler(ctx);
          // 会话刚续签时把新 cookie 带回去
          if (auth.setCookie) res.headers.append("Set-Cookie", auth.setCookie);
          return withoutBodyForHead(request, res);
        }
        return withoutBodyForHead(request, await route.handler(ctx));
      } catch (err) {
        if (err instanceof HttpError) return fail(err.status, err.message);
        console.error(`${request.method} ${url.pathname} failed`, err);
        return fail(500, "服务器内部错误");
      }
    }

    return pathMatched ? fail(405, "Method Not Allowed") : fail(404, "Not Found");
  }
}

function split(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function match(pattern: string[], actual: string[]): Record<string, string> | null {
  if (pattern.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(actual[i]);
    } else if (p !== actual[i]) {
      return null;
    }
  }
  return params;
}

function withoutBodyForHead(request: Request, res: Response): Response {
  if (request.method !== "HEAD") return res;
  return new Response(null, { status: res.status, headers: res.headers });
}
