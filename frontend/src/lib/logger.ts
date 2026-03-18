// 日志和错误处理工具
// 在生产环境中可以替换为专业的日志系统

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, error?: Error | unknown, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, error, ...args);
    }
    // 在生产环境中，这里可以发送到错误监控服务
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

export default logger;
