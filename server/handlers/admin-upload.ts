import { randomBytes } from "node:crypto";
import { uploads } from "../store";
import { HttpError, ok } from "../http";
import type { Handler } from "../router";

// 平台单请求体上限 6MB, 留出 multipart 开销
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export function iconFileName(prefix: string, ext: string): string {
  return `icons/${prefix}_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`;
}

export const upload: Handler = async ({ request }) => {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_UPLOAD_SIZE + 64 * 1024) throw new HttpError(400, "文件大小超过5MB限制");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError(400, "请选择要上传的文件");
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) throw new HttpError(400, "请选择要上传的文件");
  if (file.size > MAX_UPLOAD_SIZE) throw new HttpError(400, "文件大小超过5MB限制");

  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new HttpError(400, "不支持的文件类型");

  const path = await uploads.put(iconFileName("icon", ext), await file.arrayBuffer());
  return ok({ url: path, path }, "文件上传成功");
};
