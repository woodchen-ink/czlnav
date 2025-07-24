// 统一的环境变量配置
// 基于 APP_URL 生成各种需要的 URL

const getAppUrl = () => {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:3000"
  );
};

export const env = {
  // 基础配置
  APP_URL: getAppUrl(),

  // 派生的 URL 配置
  API_URL: `${getAppUrl()}/api`,
  AUTH_CALLBACK_URL: `${getAppUrl()}/api/auth/callback`,

  // 数据库配置
  DATABASE_URL: process.env.DATABASE_URL || "file:./data.db",

  // 网站信息
  SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || "CZL Nav",
  SITE_DESCRIPTION:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "CZL Nav 是一个导航网站，收录优质CZL服务和应用",
  UPLOAD_DIR: process.env.NEXT_PUBLIC_UPLOAD_DIR || "uploads",

  // OAuth2 配置
  CZL_CONNECT_CLIENT_ID: process.env.CZL_CONNECT_CLIENT_ID || "",
  CZL_CONNECT_CLIENT_SECRET: process.env.CZL_CONNECT_CLIENT_SECRET || "",

  // 运行环境
  NODE_ENV: process.env.NODE_ENV || "development",

  // 兼容旧的环境变量
  get NEXT_PUBLIC_API_URL() {
    return this.API_URL;
  },

  get CZL_CONNECT_REDIRECT_URI() {
    return this.AUTH_CALLBACK_URL;
  },
};

export default env;
