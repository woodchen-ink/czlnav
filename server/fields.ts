import { HttpError } from "./http";

// 请求体字段校验. 只做类型收敛, 业务规则留在 handler.

export function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new HttpError(400, message);
  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new HttpError(400, "请求数据格式错误");
  return value.trim() === "" ? null : value;
}

export function integer(value: unknown, message = "请求数据格式错误"): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) throw new HttpError(400, message);
  return n;
}

export function has(input: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export interface SortUpdate {
  id: number;
  sortOrder: number;
}

export function sortUpdates(input: Record<string, unknown>): SortUpdate[] {
  if (!Array.isArray(input.updates)) throw new HttpError(400, "请求数据格式错误");
  return input.updates.map((u) => {
    if (!u || typeof u !== "object") throw new HttpError(400, "请求数据格式错误");
    const { id, sortOrder } = u as Record<string, unknown>;
    return { id: integer(id), sortOrder: integer(sortOrder) };
  });
}
