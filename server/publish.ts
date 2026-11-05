import type { Env } from "./env";
import type { Handler } from "./router";

// 公开页是构建期预渲染的静态 HTML, 后台改动后要重新构建才会出现在前台.
// 写操作成功后触发 CNB 流水线 (.cnb.yml 中 main 分支的 api_trigger_publish 事件),
// 流水线自带 lock + cancel-in-progress, 连续保存只会部署最后一次.

const CNB_API = "https://api.cnb.cool";
const DEFAULT_REPO = "czl/czlnav";
const TRIGGER_TIMEOUT_MS = 5_000;

export async function triggerPublish(env: Env): Promise<void> {
  if (!env.CNB_TRIGGER_TOKEN) {
    console.warn("CNB_TRIGGER_TOKEN not set, skip publish trigger");
    return;
  }
  const repo = env.CNB_REPO ?? DEFAULT_REPO;
  try {
    const res = await fetch(`${CNB_API}/${repo}/-/build/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CNB_TRIGGER_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ branch: "main", event: "api_trigger_publish", title: "后台内容更新" }),
      signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
    });
    if (!res.ok) console.error("publish trigger failed", res.status, await res.text());
  } catch (err) {
    // 触发失败不影响保存结果; 可在 CNB 控制台手动运行 web_trigger_publish 补发布
    console.error("publish trigger failed", err);
  }
}

// 包装写接口: 业务成功 (2xx) 后触发发布. 必须 await, Serverless 返回后后台任务可能被冻结.
export function publishAfter(handler: Handler): Handler {
  return async (ctx) => {
    const res = await handler(ctx);
    if (res.ok) await triggerPublish(ctx.env);
    return res;
  };
}
