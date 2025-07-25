"use client";

export default function CategoryNavStyles() {
  return (
    <style jsx global>{`
      .category-nav-link.active-category {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
        transform: translateX(4px);
      }

      .category-nav-link.active-category .category-name {
        color: rgba(255, 255, 255, 1);
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .category-nav-link.active-category span:not(.category-name) {
        color: rgba(255, 255, 255, 0.8) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .category-nav-link.active-category .category-icon-container {
        background: hsl(var(--primary) / 0.15);
        border: 1px solid hsl(var(--primary) / 0.2);
        transform: scale(1.05);
      }

      .category-nav-link.active-category .active-indicator {
        height: 1.5rem;
        background: hsl(var(--primary));
        animation: growIndicator 0.3s ease-out forwards;
      }

      .category-nav-link.active-category .arrow-indicator {
        opacity: 1;
        color: hsl(var(--primary));
        animation: bounceArrow 0.4s ease-out forwards;
      }

      /* 活跃指示器生长动画 */
      @keyframes growIndicator {
        from {
          height: 0;
          opacity: 0;
        }
        to {
          height: 1.5rem;
          opacity: 1;
        }
      }

      /* 箭头弹跳动画 */
      @keyframes bounceArrow {
        0% {
          opacity: 0;
          transform: translateX(-5px);
        }
        50% {
          transform: translateX(2px);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* 点击波纹效果 */
      @keyframes clickRipple {
        from {
          opacity: 0.6;
          transform: scale(0);
        }
        to {
          opacity: 0;
          transform: scale(1);
        }
      }

      .category-nav-link::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
          circle,
          hsl(var(--primary) / 0.2) 0%,
          transparent 70%
        );
        border-radius: inherit;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
        pointer-events: none;
      }

      .category-nav-link:active::before {
        animation: clickRipple 0.6s ease-out;
      }

      /* 悬浮微动效果 */
      .category-nav-link:hover {
        transform: translateX(2px);
        box-shadow: 0 4px 12px hsl(var(--foreground) / 0.08);
      }

      .category-nav-link:hover .category-icon-container {
        transform: scale(1.02);
        box-shadow: 0 2px 4px hsl(var(--primary) / 0.15);
      }

      /* 增强过渡效果 */
      .category-nav-link {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .category-icon-container {
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .arrow-indicator {
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .active-indicator {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* 滚动条样式 */
      .scrollbar-thin {
        scrollbar-width: thin;
      }

      .scrollbar-thumb-muted::-webkit-scrollbar {
        width: 6px;
      }

      .scrollbar-thumb-muted::-webkit-scrollbar-track {
        background: transparent;
      }

      .scrollbar-thumb-muted::-webkit-scrollbar-thumb {
        background: hsl(var(--muted-foreground) / 0.3);
        border-radius: 3px;
        transition: background 0.2s ease;
      }

      .scrollbar-thumb-muted::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground) / 0.5);
      }

      /* 侧边栏入场动画优化 */
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .category-nav-link {
        opacity: 1; /* 确保立即可见 */
        animation: slideInLeft 0.4s ease-out forwards;
      }

      .category-nav-link.loaded {
        opacity: 1;
      }

      /* 侧边栏容器动画 */
      .sidebar-container {
        animation: fadeInUp 0.5s ease-out forwards;
      }

      /* 分类切换时的流畅过渡 */
      .category-nav-link.transitioning {
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* 加载状态动画 */
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .category-nav-link.loading {
        animation: pulse 1.5s ease-in-out infinite;
      }

      /* 响应式调整 */
      @media (max-width: 1279px) {
        .category-nav-link {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
        }

        .category-nav-link:hover {
          transform: none;
        }

        .category-nav-link.active-category {
          transform: none;
        }
      }

      /* 减少移动设备上的动画以提升性能 */
      @media (prefers-reduced-motion: reduce) {
        .category-nav-link,
        .category-icon-container,
        .arrow-indicator,
        .active-indicator {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
