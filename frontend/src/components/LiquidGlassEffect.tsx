"use client";

import { useEffect } from "react";

/*
 * Liquid Glass —— 真折射实现 (基于 shuding/liquid-glass 思路)
 *
 * 原理: 给每个 .liquid-glass 元素动态生成一张 displacement map,
 *       用 SDF 算每像素到圆角矩形边缘的距离, 在边缘做位移、中间不动.
 *       通过 CSS backdrop-filter: url(#filter) 让 SVG feDisplacementMap
 *       扭曲背后内容, 形成真实的"边缘弯曲折射"视觉.
 *
 * 全局 IntersectionObserver 监听 .liquid-glass 元素进入视口, 按需生成 filter;
 * ResizeObserver 在尺寸变化时重新生成位移图.
 */

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
  if (svgContainer && document.body.contains(svgContainer)) {
    return svgContainer;
  }
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText =
    "position: fixed; top: 0; left: 0; width: 0; height: 0; pointer-events: none; overflow: hidden;";
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
  radius: number
): number {
  const qx = Math.abs(x) - halfW + radius;
  const qy = Math.abs(y) - halfH + radius;
  return (
    Math.min(Math.max(qx, qy), 0) +
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) -
    radius
  );
}

/* 生成位移图 dataURL: R 通道编码 dx, G 通道编码 dy, 边缘附近做位移 */
/*
 * 生成位移图: 以 DPR 倍率渲染, 用 SDF 在边缘附近做位移、中心保持原样.
 * 坐标系按元素长边归一化到 [-1, 1], 短边按比例缩放, 避免长方形元素畸变.
 */
function buildDisplacementMap(
  width: number,
  height: number,
  cornerRadiusPx: number
): { url: string; scale: number; canvasW: number; canvasH: number } {
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const canvasW = Math.round(width * dpr);
  const canvasH = Math.round(height * dpr);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { url: "", scale: 0, canvasW: width, canvasH: height };
  }

  const image = ctx.createImageData(canvasW, canvasH);
  const data = image.data;

  /* 归一化到长边 = 1: 这样位移强度跟元素朝向无关, 短边比例自动吸收 */
  const longSide = Math.max(width, height);
  const halfW = width / longSide / 2;
  const halfH = height / longSide / 2;
  const radius = Math.min(cornerRadiusPx / longSide, Math.min(halfW, halfH) - 0.001);

  /* 折射带宽度: 占长边的 12%, 越大边缘越柔和 */
  const refractionBand = 0.12;
  /* 位移强度: 占长边的 6%, 太大会撕裂图像 */
  const refractionStrength = 0.06;

  let maxScale = 0;
  const buf = new Float32Array(canvasW * canvasH * 2);
  let bufIdx = 0;

  for (let y = 0; y < canvasH; y++) {
    const v = (y / canvasH - 0.5) * (height / longSide);
    for (let x = 0; x < canvasW; x++) {
      const u = (x / canvasW - 0.5) * (width / longSide);
      const dist = roundedRectSDF(u, v, halfW, halfH, radius);
      /* dist 在元素内为负, 边缘为 0, 外部为正; 我们只在 [-band, 0] 区间做位移 */
      const t = smoothStep(-refractionBand, 0, dist);
      /* 位移方向: 沿径向向外 (背景被"挤"向边缘, 视觉上是边缘弯曲) */
      const len = Math.hypot(u, v) || 1;
      const dirX = u / len;
      const dirY = v / len;
      const mag = t * refractionStrength * longSide;
      const dx = dirX * mag;
      const dy = dirY * mag;
      maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
      buf[bufIdx++] = dx;
      buf[bufIdx++] = dy;
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
  /* feDisplacementMap 的 scale 单位是用户单位 (px); 我们图像是 DPR 倍, scale 还原到 CSS 像素 */
  return {
    url: canvas.toDataURL(),
    scale: (maxScale * 2) / dpr,
    canvasW,
    canvasH,
  };
}

/* 给元素挂上 SVG filter, 并把 backdrop-filter 设为 url(#id) */
function attachFilter(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width < 8 || height < 8) return;

  const radiusStr = getComputedStyle(el).borderRadius;
  const radius = parseFloat(radiusStr) || 16;

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
  /* preserveAspectRatio="none" 让高 DPR 位移图正确缩放到 CSS 像素尺寸 */
  feImage.setAttribute("preserveAspectRatio", "none");

  const { url, scale } = buildDisplacementMap(width, height, radius);
  feImage.setAttributeNS(XLINK_NS, "href", url);
  feImage.setAttribute("href", url);
  feDisp.setAttribute("scale", String(scale));

  /* 应用到元素: backdrop-filter 链式叠加 SVG filter + 弱模糊 + 饱和 */
  const filterChain = `url(#${id}) blur(0.5px) saturate(180%) brightness(1.05)`;
  el.style.setProperty("backdrop-filter", filterChain);
  el.style.setProperty("-webkit-backdrop-filter", filterChain);

  glassMap.set(el, { id, width, height, radius });
}

export default function LiquidGlassEffect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    /* Safari WebKit 不支持 SVG filter 在 backdrop-filter 中链式使用, 检测后退化 */
    const supportsBackdropFilterUrl = CSS.supports?.(
      "backdrop-filter",
      "url(#x)"
    );
    if (!supportsBackdropFilterUrl) return;

    const elements = new Set<HTMLElement>();

    const refreshAll = () => {
      elements.forEach(el => {
        if (document.body.contains(el)) {
          attachFilter(el);
        } else {
          elements.delete(el);
        }
      });
    };

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        attachFilter(entry.target as HTMLElement);
      }
    });

    const collect = () => {
      document.querySelectorAll<HTMLElement>(".liquid-glass").forEach(el => {
        if (!elements.has(el)) {
          elements.add(el);
          resizeObserver.observe(el);
          attachFilter(el);
        }
      });
    };

    collect();

    /* 监听后续插入的 .liquid-glass 节点 */
    const mutationObserver = new MutationObserver(() => collect());
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("resize", refreshAll);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", refreshAll);
    };
  }, []);

  return null;
}
