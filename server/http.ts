// 统一响应: { success, message, data }, 与旧 Go 版 handler/response.go 契约一致.

const NO_CACHE = "no-cache, no-store, must-revalidate";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, message = "操作成功", init?: ResponseInit): Response {
  return json({ success: true, message, data }, 200, init);
}

export function fail(status: number, message: string): Response {
  return json({ success: false, message, data: null }, status);
}

export function json(body: unknown, status = 200, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", NO_CACHE);
  return new Response(JSON.stringify(body), { status, headers });
}

export function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location, "Cache-Control": NO_CACHE });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}

export async function readJSON<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    if (body === null || typeof body !== "object") throw new Error("not an object");
    return body as T;
  } catch {
    throw new HttpError(400, "请求数据格式错误");
  }
}

export function parseId(raw: string | undefined): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "无效的ID");
  return id;
}
