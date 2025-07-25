"use client";

export default function GlassEffects() {
  return (
    <style jsx global>{`

      @keyframes liquid-glow {
        0%,
        100% {
          opacity: 0.4;
          transform: scale(1) rotate(0deg);
        }
        33% {
          opacity: 0.7;
          transform: scale(1.05) rotate(120deg);
        }
        66% {
          opacity: 0.5;
          transform: scale(0.95) rotate(240deg);
        }
      }

      @keyframes corner-glow {
        0%,
        100% {
          opacity: 0.3;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.1);
        }
      }

      @keyframes edge-light {
        0%,
        100% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.5;
        }
      }

      .glass-container {
        position: relative;
        overflow: hidden;
      }

      .glass-container::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        border: 1px solid transparent;
        border-radius: inherit;
        background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1)) border-box;
        -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: subtract;
        mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
        mask-composite: subtract;
        pointer-events: none;
        z-index: 1;
      }

      /* 左上角光效 - 仅边框区域 */
      .glass-container::after {
        content: "";
        position: absolute;
        top: -1px;
        left: -1px;
        width: 60px;
        height: 60px;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(255, 255, 255, 0.4) 30%,
          transparent 60%
        );
        border-radius: inherit;
        pointer-events: none;
        z-index: 2;
        animation: liquid-glow 6s ease-in-out infinite;
        filter: blur(0.5px);
        clip-path: polygon(0 0, 100% 0, 100% 2px, 2px 2px, 2px 100%, 0 100%);
      }

      /* 右下角光效 - 仅边框区域 */
      .glass-container .corner-light-br {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 40px;
        height: 40px;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.6) 0%,
          rgba(255, 255, 255, 0.3) 40%,
          transparent 70%
        );
        border-radius: inherit;
        pointer-events: none;
        z-index: 2;
        animation: liquid-glow 8s ease-in-out infinite 3s;
        filter: blur(0.5px);
        clip-path: polygon(calc(100% - 2px) 0, 100% 0, 100% 100%, 0 100%, 0 calc(100% - 2px), calc(100% - 2px) calc(100% - 2px));
      }

      /* 边缘光效 - 仅边框高亮 */
      .glass-container .edge-glow {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: inherit;
        pointer-events: none;
        z-index: 3;
        animation: edge-light 6s ease-in-out infinite;
        background: transparent;
        box-shadow: 
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          inset 1px 0 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1),
          inset -1px 0 0 rgba(255, 255, 255, 0.1);
      }

      /* 边框流光效果 - 暗色版 */
      .glass-container .shimmer-effect {
        position: absolute;
        top: -1px;
        left: -1px;
        right: -1px;
        bottom: -1px;
        border-radius: inherit;
        pointer-events: none;
        z-index: 4;
        border: 1px solid transparent;
        background: linear-gradient(90deg, transparent, rgba(0,0,0,0.3), transparent) padding-box,
                   linear-gradient(90deg, transparent, rgba(0,0,0,0.2), transparent) border-box;
        background-size: 400% 100%;
        animation: shimmer 12s ease-in-out infinite;
        opacity: 0.8;
      }

      @keyframes shimmer {
        0% {
          background-position: -300% 0;
          opacity: 0;
        }
        20% {
          opacity: 0.7;
        }
        80% {
          opacity: 0.7;
        }
        100% {
          background-position: 300% 0;
          opacity: 0;
        }
      }

      /* 悬停效果增强 */
      .glass-container:hover::after {
        animation-duration: 2s;
      }

      .glass-container:hover .corner-light-br {
        animation-duration: 2s;
      }

      .glass-container:hover .shimmer-effect {
        animation-duration: 4s;
      }
    `}</style>
  );
}
