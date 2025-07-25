"use client";

export default function GlassEffects() {
  return (
    <style jsx global>{`
      /* SVG滤镜定义 */
      body::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -10;
        background:
          radial-gradient(
            circle at 20% 80%,
            rgba(120, 119, 198, 0.3),
            transparent 50%
          ),
          radial-gradient(
            circle at 80% 20%,
            rgba(255, 119, 198, 0.3),
            transparent 50%
          ),
          radial-gradient(
            circle at 40% 40%,
            rgba(255, 255, 255, 0.1),
            transparent 50%
          );
      }

      /* 科技粒子动效 */
      @keyframes float-particles {
        0%,
        100% {
          transform: translateY(0px) rotate(0deg);
          opacity: 0.7;
        }
        33% {
          transform: translateY(-10px) rotate(120deg);
          opacity: 1;
        }
        66% {
          transform: translateY(5px) rotate(240deg);
          opacity: 0.8;
        }
      }

      @keyframes corner-glow {
        0%,
        100% {
          opacity: 0.4;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.1);
        }
      }

      @keyframes edge-light {
        0%,
        100% {
          opacity: 0.3;
        }
        50% {
          opacity: 0.7;
        }
      }

      /* 玻璃扭曲效果 */
      @keyframes glass-distort {
        0%,
        100% {
          filter: blur(0px) saturate(1.2);
        }
        50% {
          filter: blur(0.3px) saturate(1.5);
        }
      }

      /* 液态玻璃容器 - 三层效果实现 */
      .glass-container {
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* 第一层：玻璃扭曲效果 */
      .glass-container::before {
        content: "";
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.4) 0%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(255, 255, 255, 0.3) 100%
        );
        border-radius: inherit;
        filter: blur(0.5px);
        animation: glass-distort 4s ease-in-out infinite;
        -webkit-mask:
          linear-gradient(#fff 0 0) padding-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: subtract;
        mask:
          linear-gradient(#fff 0 0) padding-box,
          linear-gradient(#fff 0 0);
        mask-composite: subtract;
        pointer-events: none;
        z-index: 1;
      }

      /* 第三层：光泽高亮 + 右下角苹果渐变光效 */
      .glass-container .corner-light-br {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 50px;
        height: 50px;
        background: radial-gradient(
          circle at center,
          rgba(255, 69, 58, 0.9) 0%,
          /* 苹果红 */ rgba(255, 149, 0, 0.7) 30%,
          /* 苹果橙 */ rgba(175, 82, 222, 0.5) 60%,
          /* 苹果紫 */ transparent 80%
        );
        border-radius: inherit;
        pointer-events: none;
        z-index: 3;
        animation: corner-glow 6s ease-in-out infinite 3s;
        filter: blur(0.8px);
        clip-path: polygon(
          calc(100% - 3px) 0,
          100% 0,
          100% 100%,
          0 100%,
          0 calc(100% - 3px),
          calc(100% - 3px) calc(100% - 3px)
        );
        mix-blend-mode: screen;
      }

      /* 玻璃边缘高亮效果 */
      .glass-container .edge-glow {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: inherit;
        pointer-events: none;
        z-index: 4;
        animation: edge-light 6s ease-in-out infinite;
        background: transparent;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.4),
          inset 1px 0 0 rgba(255, 255, 255, 0.3),
          inset 0 -1px 0 rgba(255, 255, 255, 0.2),
          inset -1px 0 0 rgba(255, 255, 255, 0.2),
          0 0 20px rgba(255, 255, 255, 0.1);
      }

      /* 科技流光效果 - 减弱版 */
      .glass-container .shimmer-effect {
        position: absolute;
        top: -1px;
        left: -1px;
        right: -1px;
        bottom: -1px;
        border-radius: inherit;
        pointer-events: none;
        z-index: 5;
        border: 1px solid transparent;
        background:
          linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.25),
              rgba(255, 255, 255, 0.15),
              rgba(255, 255, 255, 0.25),
              transparent
            )
            padding-box,
          linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.12),
              transparent
            )
            border-box;
        background-size: 300% 100%;
        animation: shimmer 8s ease-in-out infinite;
        opacity: 0.6;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
          opacity: 0;
        }
        15% {
          opacity: 0.8;
        }
        85% {
          opacity: 0.8;
        }
        100% {
          background-position: 200% 0;
          opacity: 0;
        }
      }

      /* 悬停时的缩放和阴影过渡 */
      .glass-container:hover {
        transform: scale(1.02) translateZ(0);
        box-shadow:
          0 20px 40px rgba(0, 0, 0, 0.3),
          0 10px 20px rgba(255, 255, 255, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.4);
      }

      .glass-container:hover .corner-light-br {
        animation-duration: 3s;
        filter: blur(1.2px);
      }

      .glass-container:hover .shimmer-effect {
        animation-duration: 4s;
        opacity: 1;
      }

      /* 菜单项高亮效果 */
      .glass-container .menu-item {
        position: relative;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .glass-container .menu-item:hover {
        background: linear-gradient(
          135deg,
          rgba(255, 69, 58, 0.2),
          /* 苹果红 */ rgba(255, 149, 0, 0.2),
          /* 苹果橙 */ rgba(175, 82, 222, 0.2) /* 苹果紫 */
        );
        color: rgba(255, 255, 255, 0.95);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
      }

      /* Bento卡片高对比突出 */
      .bento-highlight {
        background: linear-gradient(
          135deg,
          rgba(255, 69, 58, 0.15),
          /* 苹果红 */ rgba(255, 149, 0, 0.15),
          /* 苹果橙 */ rgba(175, 82, 222, 0.15) /* 苹果紫 */
        ) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        color: rgba(255, 255, 255, 0.95) !important;
        font-weight: 600 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      }

      /* SVG勾线图形动效 */
      .tech-svg-outline {
        stroke: rgba(255, 255, 255, 0.4);
        stroke-width: 1px;
        fill: none;
        animation: float-particles 8s ease-in-out infinite;
      }

      /* 科技微粒效果 */
      .tech-particles::before {
        content: "";
        position: absolute;
        top: 10%;
        left: 10%;
        width: 2px;
        height: 2px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: float-particles 6s ease-in-out infinite;
        box-shadow:
          20px 10px 0 rgba(255, 69, 58, 0.6),
          40px 20px 0 rgba(255, 149, 0, 0.6),
          60px 15px 0 rgba(175, 82, 222, 0.6);
      }
    `}</style>
  );
}
