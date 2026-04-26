---
title: 在 Web 上做出 iOS 26 那种"液态玻璃" —— 真折射版本
date: 2026-04-26
tags: [CSS, SVG, React, UI]
---

苹果在 iOS 26 把"毛玻璃"升级成了"液态玻璃 (Liquid Glass)"，最直观的差别是边缘会真的弯曲折射背景，而不是过去那种"整块磨砂"。社区里很快冒出一批 Web 实现，但大多数还是 `backdrop-filter: blur` 加几道渐变高光，看起来还是塑料感。

这篇分享一个能在网页上跑、视觉接近 iOS 26 的真折射方案：CSS `backdrop-filter` 链式调用一个 SVG `feDisplacementMap`，位移图用 `<canvas>` 配合 SDF 实时算出来，全套加起来 200 行不到。

## 先看效果差异

普通毛玻璃：

- 整片均匀模糊
- 中心和边缘看起来一样
- 高光是固定渐变叠出来的

真折射玻璃：

- 中心区透明清晰，背景颜色直接透出来
- 边缘附近背景被"挤"向外侧，形成肉眼可见的弯曲
- 玻璃边有一圈薄薄的高光带（折射本身造成的光线聚集）

## 核心思路

CSS `backdrop-filter` 不只能写 `blur` `saturate` 这些函数，还能链式叠加 SVG filter：

```css
backdrop-filter: url(#my-filter) blur(0.5px) saturate(180%);
```

`url(#my-filter)` 会把背后内容当作 filter 的输入，运行 SVG filter 链返回结果。我们要的就是 SVG `<feDisplacementMap>`：根据一张"位移图"的 R/G 通道，把每个像素按指定方向偏移。

```xml
<filter id="my-filter">
  <feImage href="data:image/png;base64,..." />
  <feDisplacementMap in="SourceGraphic" in2="map"
                     xChannelSelector="R" yChannelSelector="G" />
</filter>
```

R 通道值减去 128 = X 方向偏移量，G 通道值减去 128 = Y 方向偏移量。位移图是什么样，背景就被怎么扭。

剩下的问题就是：**位移图怎么生成**？

## 位移图：用 SDF 描述圆角矩形边缘

我们想要的位移规则：

- 元素中心：位移 = 0（背景不动）
- 边缘附近一圈：位移 = 沿径向向外（背景被"挤"向外）
- 元素外面：位移 = 0（不影响）

要让"中心 → 边缘"有连续过渡，用 **SDF (Signed Distance Field, 有向距离场)** —— 每个像素到形状边缘的距离，内部为负、边缘为 0、外部为正。

圆角矩形的 SDF 公式：

```ts
function roundedRectSDF(x, y, halfW, halfH, radius) {
  const qx = Math.abs(x) - halfW + radius;
  const qy = Math.abs(y) - halfH + radius;
  return Math.min(Math.max(qx, qy), 0)
       + Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
       - radius;
}
```

不需要看懂，是 Inigo Quilez 标准实现，照抄就行。

有了 SDF，位移图的生成就清晰了：

```ts
for (每个像素 (x, y)) {
  const dist = roundedRectSDF(x, y, ...);

  // 仅在 [-band, 0] 区间做位移：从内部一段距离到边缘
  const t = smoothStep(-band, 0, dist);

  // 位移方向：沿径向向外
  const len = Math.hypot(x, y);
  const dirX = x / len;
  const dirY = y / len;
  const mag = t * strength;

  位移图.R = dirX * mag * 128 + 128;
  位移图.G = dirY * mag * 128 + 128;
}
```

`smoothStep` 是着色器里常用的平滑插值，让 0 → 1 的过渡两端导数为 0，避免折射带出现硬边。

`band` 是折射带宽度，`strength` 是最大位移幅度。我用的值是 `band = 12% × 长边`、`strength = 6% × 长边`，这两个参数决定"玻璃厚不厚"。

## 编码进 RGB 通道

`feDisplacementMap` 拿到的位移图，每个通道是 8 bit 整数（0-255），表示位移的范围是 -128 到 127 像素。所以我们要：

1. 算出所有像素的位移最大绝对值 `maxScale`
2. 把每个 dx/dy 归一化到 [-1, 1]：`dx / maxScale`
3. 映射到 [0, 255]：`(dx / maxScale / 2 + 0.5) × 255`
4. 写到 `feDisplacementMap` 的 `scale` 属性，告诉 SVG 这个最大值是多少 px

```ts
data[p]     = (dx / maxScale / 2 + 0.5) * 255;  // R
data[p + 1] = (dy / maxScale / 2 + 0.5) * 255;  // G
data[p + 2] = 0;
data[p + 3] = 255;
// ...
feDisp.setAttribute("scale", String(maxScale * 2));
```

`scale × 2` 是因为 8 bit 编码区间是 [-128, 127]，对应 [-1, 1] 半径，最大位移幅度等于 `2 × maxScale`。

## 一个细节：DPR

直接以 CSS 像素生成 canvas，在 Retina 屏（DPR=2/3）上会出现明显的像素感、过渡发抖。解决方法是按 `devicePixelRatio` 倍率渲染 canvas，然后在 `<feImage>` 上设 `preserveAspectRatio="none"`，让 SVG 自动把它缩到 CSS 尺寸；同时 `feDisplacementMap` 的 `scale` 也要除以 dpr 还原成 CSS 像素。

```ts
const dpr = Math.min(2, window.devicePixelRatio || 1);
canvas.width = width * dpr;
canvas.height = height * dpr;

// ...

return {
  url: canvas.toDataURL(),
  scale: (maxScale * 2) / dpr,
};
```

`Math.min(2, ...)` 是给手机端降级用，3x 屏算 9 倍像素太重。

## 另一个细节：长方形元素

最早写的版本，宽高比相同的卡片很自然，竖长卡片边缘明显畸变。原因是坐标系是按 `[-0.5, 0.5]` 各自归一化的，长方形里 `len = sqrt(u² + v²)` 算出来的"径向方向"不准。

正确做法是按**长边**归一化，短边按比例缩放：

```ts
const longSide = Math.max(width, height);
const halfW = width / longSide / 2;
const halfH = height / longSide / 2;
// 遍历像素时：
const u = (x / canvasW - 0.5) * (width / longSide);
const v = (y / canvasH - 0.5) * (height / longSide);
```

这样不管什么长宽比，折射强度沿真实径向方向衰减。

## 让它在任意 React 应用里能用

到这里所有数学算完了，剩下是工程化：让任何带 `.liquid-glass` class 的元素都自动获得这个效果。

```tsx
"use client";
import { useEffect } from "react";

export default function LiquidGlassEffect() {
  useEffect(() => {
    // 不支持 backdrop-filter: url() 的浏览器直接退化
    if (!CSS.supports?.("backdrop-filter", "url(#x)")) return;

    const elements = new Set<HTMLElement>();
    const resizeObserver = new ResizeObserver(entries => {
      for (const e of entries) attachFilter(e.target as HTMLElement);
    });

    const collect = () => {
      document.querySelectorAll<HTMLElement>(".liquid-glass").forEach(el => {
        if (elements.has(el)) return;
        elements.add(el);
        resizeObserver.observe(el);
        attachFilter(el);
      });
    };

    collect();

    // 监听后续 React 渲染插入的节点
    const mo = new MutationObserver(collect);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return null;
}
```

`attachFilter` 会：

1. 读元素的 `getBoundingClientRect()` 拿 width/height
2. 读 `getComputedStyle().borderRadius` 拿圆角
3. 比对缓存（同尺寸不重复生成）
4. 创建（或更新）SVG filter，写入位移图
5. 把 `backdrop-filter: url(#filter-id) blur(0.5px) saturate(180%) brightness(1.05)` 设到元素 inline style

`ResizeObserver` 处理尺寸变化，`MutationObserver` 处理动态节点。在 layout 顶层渲染一次 `<LiquidGlassEffect />` 就够了。

## CSS 那部分

JS 负责折射，CSS 负责"玻璃"剩下的东西：

```css
.liquid-glass {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: rgba(255, 255, 255, 0.04);

  /* 退化方案：filter 没注入也至少是毛玻璃 */
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);

  /* 三层边光：外细亮边 + 顶高光 + 底暗影 + 投影 */
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(0, 0, 0, 0.22),
    0 18px 40px rgba(0, 0, 0, 0.16);

  border: none;
  transition: box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.liquid-glass:hover {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(0, 0, 0, 0.14),
    0 8px 24px rgba(0, 0, 0, 0.26),
    0 20px 44px rgba(0, 0, 0, 0.18);
}
```

`isolation: isolate` 创建合成层避免父级混合模式干扰；三层 inset shadow 模拟玻璃边缘的光学厚度 —— 外细亮边是玻璃外缘反光，顶高光是顶部边缘反射环境光，底暗影是底部内表面阴影。

## 用法

```tsx
<div className="liquid-glass rounded-2xl p-6">内容</div>
```

只要这个元素叠在有色彩的背景上就能看到折射。背景越鲜艳、越有纹理，效果越明显。如果背景是纯白或纯黑，折射变形是肉眼几乎看不出来的，因为没东西可"扭"。

## 完整代码

合到一个文件可以直接拷的版本：

### `liquid-glass.css`

```css
.liquid-glass {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(0, 0, 0, 0.22),
    0 18px 40px rgba(0, 0, 0, 0.16);
  border: none;
  transition: box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.liquid-glass > * {
  position: relative;
  z-index: 1;
}

.liquid-glass:hover {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -1px 0 rgba(0, 0, 0, 0.14),
    0 8px 24px rgba(0, 0, 0, 0.26),
    0 20px 44px rgba(0, 0, 0, 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .liquid-glass,
  .liquid-glass:hover {
    transition: none;
  }
}
```

### `LiquidGlassEffect.tsx`

```tsx
"use client";

import { useEffect } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

interface GlassMeta {
  id: string;
  width: number;
  height: number;
  radius: number;
}

const glassMap = new WeakMap<HTMLElement, GlassMeta>();
let svgContainer: SVGSVGElement | null = null;
let idCounter = 0;

function ensureSvgContainer(): SVGSVGElement {
  if (svgContainer && document.body.contains(svgContainer)) return svgContainer;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;overflow:hidden;";
  const defs = document.createElementNS(SVG_NS, "defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);
  svgContainer = svg;
  return svg;
}

function smoothStep(a: number, b: number, t: number): number {
  const v = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return v * v * (3 - 2 * v);
}

function roundedRectSDF(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  r: number
) {
  const qx = Math.abs(x) - halfW + r;
  const qy = Math.abs(y) - halfH + r;
  return (
    Math.min(Math.max(qx, qy), 0) +
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) -
    r
  );
}

function buildDisplacementMap(
  width: number,
  height: number,
  cornerRadiusPx: number
) {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const cw = Math.round(width * dpr);
  const ch = Math.round(height * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { url: "", scale: 0 };

  const image = ctx.createImageData(cw, ch);
  const data = image.data;

  const longSide = Math.max(width, height);
  const halfW = width / longSide / 2;
  const halfH = height / longSide / 2;
  const radius = Math.min(
    cornerRadiusPx / longSide,
    Math.min(halfW, halfH) - 0.001
  );

  const refractionBand = 0.12;
  const refractionStrength = 0.06;

  let maxScale = 0;
  const buf = new Float32Array(cw * ch * 2);
  let bi = 0;

  for (let y = 0; y < ch; y++) {
    const v = (y / ch - 0.5) * (height / longSide);
    for (let x = 0; x < cw; x++) {
      const u = (x / cw - 0.5) * (width / longSide);
      const dist = roundedRectSDF(u, v, halfW, halfH, radius);
      const t = smoothStep(-refractionBand, 0, dist);
      const len = Math.hypot(u, v) || 1;
      const mag = t * refractionStrength * longSide;
      const dx = (u / len) * mag;
      const dy = (v / len) * mag;
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      buf[bi++] = dx;
      buf[bi++] = dy;
    }
  }

  if (maxScale === 0) maxScale = 1;

  let i = 0;
  for (let p = 0; p < data.length; p += 4) {
    const r = buf[i++] / maxScale / 2 + 0.5;
    const g = buf[i++] / maxScale / 2 + 0.5;
    data[p] = r * 255;
    data[p + 1] = g * 255;
    data[p + 2] = 0;
    data[p + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return { url: canvas.toDataURL(), scale: (maxScale * 2) / dpr };
}

function attachFilter(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width < 8 || height < 8) return;

  const radius = parseFloat(getComputedStyle(el).borderRadius) || 16;
  const existing = glassMap.get(el);
  if (
    existing &&
    existing.width === width &&
    existing.height === height &&
    existing.radius === radius
  ) {
    return;
  }

  const svg = ensureSvgContainer();
  const defs = svg.querySelector("defs")!;
  const id = existing?.id ?? `lg-filter-${++idCounter}`;
  let filter = defs.querySelector<SVGFilterElement>(`#${id}`);
  let feImage: SVGFEImageElement;
  let feDisp: SVGFEDisplacementMapElement;

  if (!filter) {
    filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("colorInterpolationFilters", "sRGB");
    filter.setAttribute("x", "0");
    filter.setAttribute("y", "0");

    feImage = document.createElementNS(SVG_NS, "feImage");
    feImage.setAttribute("id", `${id}-img`);
    feImage.setAttribute("x", "0");
    feImage.setAttribute("y", "0");

    feDisp = document.createElementNS(SVG_NS, "feDisplacementMap");
    feDisp.setAttribute("in", "SourceGraphic");
    feDisp.setAttribute("in2", `${id}-img`);
    feDisp.setAttribute("xChannelSelector", "R");
    feDisp.setAttribute("yChannelSelector", "G");

    filter.appendChild(feImage);
    filter.appendChild(feDisp);
    defs.appendChild(filter);
  } else {
    feImage = filter.querySelector("feImage") as SVGFEImageElement;
    feDisp = filter.querySelector(
      "feDisplacementMap"
    ) as SVGFEDisplacementMapElement;
  }

  filter.setAttribute("width", String(width));
  filter.setAttribute("height", String(height));
  feImage.setAttribute("width", String(width));
  feImage.setAttribute("height", String(height));
  feImage.setAttribute("preserveAspectRatio", "none");

  const { url, scale } = buildDisplacementMap(width, height, radius);
  feImage.setAttributeNS(XLINK_NS, "href", url);
  feImage.setAttribute("href", url);
  feDisp.setAttribute("scale", String(scale));

  const filterChain = `url(#${id}) blur(0.5px) saturate(180%) brightness(1.05)`;
  el.style.setProperty("backdrop-filter", filterChain);
  el.style.setProperty("-webkit-backdrop-filter", filterChain);

  glassMap.set(el, { id, width, height, radius });
}

export default function LiquidGlassEffect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!CSS.supports?.("backdrop-filter", "url(#x)")) return;

    const elements = new Set<HTMLElement>();
    const resizeObserver = new ResizeObserver(entries => {
      for (const e of entries) attachFilter(e.target as HTMLElement);
    });

    const collect = () => {
      document.querySelectorAll<HTMLElement>(".liquid-glass").forEach(el => {
        if (elements.has(el)) return;
        elements.add(el);
        resizeObserver.observe(el);
        attachFilter(el);
      });
    };

    collect();
    const mo = new MutationObserver(collect);
    mo.observe(document.body, { childList: true, subtree: true });

    const onResize = () =>
      elements.forEach(el => {
        if (document.body.contains(el)) attachFilter(el);
        else elements.delete(el);
      });
    window.addEventListener("resize", onResize);

    return () => {
      mo.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
```

## 已知限制

**Safari**: `backdrop-filter: url()` 在 Safari ≤17 不支持。我用 `CSS.supports()` 检测后直接跳过，保留 CSS 退化方案的普通毛玻璃，仍然有边光，只是没有真折射。

**生成成本**: 每个元素首次需要算 `width × height × dpr²` 个像素的 SDF。1000×600 元素在 DPR=2 下要算 480 万次像素，主线程占用 30-50ms。建议玻璃元素控制在卡片尺寸（≤500×400），大尺寸场景配合 `requestIdleCallback` 异步生成。

**dataURL 体积**: 每个元素的位移图作为 base64 内联在 SVG href 里，1000×600 元素约 2MB。如果一个页面有几十个玻璃元素，可以改用 `URL.createObjectURL(blob)` + LRU 缓存，按尺寸+圆角去重。

**纯单色背景看不出来**: 折射本质是"扭曲背景纹理"，背景是纯色没东西可扭。如果你要在纯色背景上模拟玻璃感，老老实实回到 `backdrop-filter: blur` + 渐变高光的传统方案，不要硬上。

## 调参指南

观感不满意改这三个常量：

| 参数 | 默认 | 调高效果 | 调低效果 |
|------|------|---------|---------|
| `refractionBand` | `0.12` | 折射带更宽，过渡更柔 | 折射只在最外圈，边缘锐利 |
| `refractionStrength` | `0.06` | 弯曲更夸张，容易撕裂 | 接近平面玻璃 |
| `blur(0.5px)` | `0.5px` | 平滑锯齿，但折射细节糊 | 折射锐利，可能有摩尔纹 |

`band` 和 `strength` 通常一起调：想要"厚玻璃"两个都加大，"薄玻璃"两个都减小。

## 参考

- [shuding/liquid-glass](https://github.com/shuding/liquid-glass) —— 本文直接参考的实现思路，原版只支持单个可拖动元素
- [archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass) —— iOS 26 风格交互 demo
- [nikdelvin/liquid-glass](https://github.com/nikdelvin/liquid-glass) —— 纯 CSS + SVG，不需要 JS
- [Liquid Glass in CSS (and SVG)](https://medium.com/ekino-france/liquid-glass-in-css-and-svg-839985fcb88d) —— 原理详解
- [Inigo Quilez — distance functions](https://iquilezles.org/articles/distfunctions2d/) —— SDF 公式来源
