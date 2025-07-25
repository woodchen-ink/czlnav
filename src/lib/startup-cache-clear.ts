import { memoryCache } from "./memory-cache";

// 标记是否已经清除过缓存
let hasCleared = false;

export function clearCacheOnStartup() {
  if (!hasCleared && typeof window === "undefined") {
    console.log("🗑️  容器启动时清除内存缓存...");
    memoryCache.clear();
    hasCleared = true;
    console.log("✅ 启动时缓存清理完成");
  }
}
