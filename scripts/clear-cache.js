// 清除缓存脚本 - 在容器启动时运行
// 注意：这个脚本需要在 Next.js 应用启动前运行

console.log("清除内存缓存...");

// 由于内存缓存是在应用进程中的，我们需要通过 HTTP 请求来清除
// 这个脚本会在应用启动后通过 API 清除缓存

const clearCache = async () => {
  try {
    // 等待应用启动
    console.log("等待应用启动...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    const response = await fetch("http://localhost:3000/api/admin/cache", {
      method: "DELETE",
    });

    if (response.ok) {
      console.log("✅ 启动时缓存清理成功");
    } else {
      console.log("⚠️ 启动时缓存清理失败，但不影响应用启动");
    }
  } catch (error) {
    console.log(
      "⚠️ 启动时缓存清理失败（可能是应用尚未完全启动），但不影响应用启动:",
      error.message
    );
  }
};

// 如果是在 Node.js 环境中直接运行
if (typeof require !== "undefined") {
  clearCache();
}

module.exports = { clearCache };
