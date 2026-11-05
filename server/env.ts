// Makers 控制台配置的环境变量, 由平台通过 context.env 注入.
export interface Env {
  CZL_CONNECT_CLIENT_ID?: string;
  CZL_CONNECT_CLIENT_SECRET?: string;
  // 生产必填, 必须与 CZL Connect 后台登记的回调地址完全一致.
  // 不填时按请求来源拼 <origin>/api/auth/callback, 仅用于本地开发 (函数内 request.url 不一定是公网域名).
  AUTH_CALLBACK_URL?: string;
  // 可选, 逗号分隔的 CZL Connect 用户 id 或 username; 不填则任何能登录 CZL Connect 的账号都是管理员 (旧版行为).
  ADMIN_USERS?: string;
  // 后台写操作后触发 CNB 构建发布; 只需 repo-cnb-trigger:rw 权限. 不填则只保存, 前台要等下次构建才更新.
  CNB_TRIGGER_TOKEN?: string;
  // 默认 czl/czlnav
  CNB_REPO?: string;
}

export function readEnv(raw: unknown): Env {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (key: keyof Env) => {
    const value = source[key] ?? process.env[key];
    return typeof value === "string" && value !== "" ? value : undefined;
  };
  return {
    CZL_CONNECT_CLIENT_ID: pick("CZL_CONNECT_CLIENT_ID"),
    CZL_CONNECT_CLIENT_SECRET: pick("CZL_CONNECT_CLIENT_SECRET"),
    AUTH_CALLBACK_URL: pick("AUTH_CALLBACK_URL"),
    ADMIN_USERS: pick("ADMIN_USERS"),
    CNB_TRIGGER_TOKEN: pick("CNB_TRIGGER_TOKEN"),
    CNB_REPO: pick("CNB_REPO"),
  };
}
