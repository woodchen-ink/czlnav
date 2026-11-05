import { uploads } from "../store";
import { HttpError, ok, readJSON } from "../http";
import { iconFileName } from "./admin-upload";
import type { Handler } from "../router";

const FETCH_TIMEOUT_MS = 15_000;
const FETCH_ATTEMPTS = 3;
const MAX_ICON_SIZE = 2 * 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (compatible; CZLNavBot/1.0)";

export const fetchSiteInfo: Handler = async ({ request }) => {
  const input = await readJSON(request);
  const target = parseHttpUrl(input.url, "请提供URL");

  const html = await fetchPage(target);
  if (html === null) throw new HttpError(400, "无法访问该网站");

  const title = matchFirst(html, /<title[^>]*>([^<]+)<\/title>/i) || metaContent(html, "og:title");
  const description = metaContent(html, "description") || metaContent(html, "og:description");

  const href = linkHref(html, "icon") || linkHref(html, "shortcut icon");
  const iconUrl = href ? new URL(href, target).toString() : new URL("/favicon.ico", target).toString();
  const icon = (await downloadIcon(iconUrl, target.host)) ?? "";

  return ok({ title: decodeEntities(title), description: decodeEntities(description), icon });
};

export const downloadIconHandler: Handler = async ({ request }) => {
  const input = await readJSON(request);
  const iconUrl = parseHttpUrl(input.iconUrl, "请提供图标URL");
  const localUrl = await downloadIcon(iconUrl.toString(), iconUrl.host);
  if (!localUrl) throw new HttpError(400, "下载图标失败");
  return ok({ localUrl });
};

function parseHttpUrl(raw: unknown, message: string): URL {
  if (typeof raw !== "string" || !raw.trim()) throw new HttpError(400, message);
  try {
    const url = new URL(raw.trim());
    if (url.protocol === "http:" || url.protocol === "https:") return url;
  } catch {
    // 落到下面统一报错
  }
  throw new HttpError(400, message);
}

async function fetchPage(url: URL): Promise<string | null> {
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      return await res.text();
    } catch {
      if (attempt < FETCH_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
    }
  }
  return null;
}

async function downloadIcon(iconUrl: string, hostname: string): Promise<string | null> {
  try {
    const res = await fetch(iconUrl, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    if (data.byteLength === 0 || data.byteLength > MAX_ICON_SIZE) return null;

    const ext = iconExtension(res.headers.get("Content-Type") ?? "", iconUrl);
    return await uploads.put(iconFileName(hostname.replace(/[:.]/g, "_"), ext), data);
  } catch (err) {
    console.error("download icon failed", iconUrl, err);
    return null;
  }
}

function iconExtension(contentType: string, url: string): string {
  const ct = contentType.toLowerCase();
  if (ct.includes("svg")) return "svg";
  if (ct.includes("icon")) return "ico";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("png")) return "png";
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".svg")) return "svg";
  if (path.endsWith(".ico")) return "ico";
  return "png";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchFirst(html: string, re: RegExp): string {
  return re.exec(html)?.[1]?.trim() ?? "";
}

function metaContent(html: string, name: string): string {
  const n = escapeRegExp(name);
  return (
    matchFirst(html, new RegExp(`<meta[^>]*(?:name|property)=["']${n}["'][^>]*content=["']([^"']+)["']`, "i")) ||
    matchFirst(html, new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${n}["']`, "i"))
  );
}

function linkHref(html: string, rel: string): string {
  const r = `(?:[^"']*\\s)?${escapeRegExp(rel)}(?:\\s[^"']*)?`;
  return (
    matchFirst(html, new RegExp(`<link[^>]*rel=["']${r}["'][^>]*href=["']([^"']+)["']`, "i")) ||
    matchFirst(html, new RegExp(`<link[^>]*href=["']([^"']+)["'][^>]*rel=["']${r}["']`, "i"))
  );
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}
