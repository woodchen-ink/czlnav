"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import Image from "next/image";
import { SearchIcon } from "./icons/SearchIcon";
import { SearchResult } from "@/types/api";

// 添加自定义滚动条样式
const scrollbarStyles = `
  /* 滚动条整体样式 */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  /* 滚动条轨道 */
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }
  
  /* 滚动条滑块 */
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    transition: all 0.2s ease;
  }
  
  /* 滚动条滑块悬停效果 */
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  /* Firefox滚动条样式 */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  }
`;

export default function LiveSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 处理搜索框输入变化
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        setShowResults(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/live-search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await response.json();

        if (data.success) {
          setResults(data.data || []);
          setShowResults(true);
        } else {
          setResults([]);
          setShowResults(false);
          if (process.env.NODE_ENV === "development") {
            console.error("搜索失败:", data.message);
          }
        }
      } catch (error) {
        setResults([]);
        setShowResults(false);
        if (process.env.NODE_ENV === "development") {
          console.error("搜索失败:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    // 使用防抖处理输入
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // 处理表单提交（按回车键）
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 如果有选中的结果，直接跳转到该结果的URL
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleResultClick(results[selectedIndex]);
      } else if (results.length === 0 && !loading) {
        // 如果没有搜索结果且不在加载中，跳转到Google搜索
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`,
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        // 没有找到结果时跳转到Google搜索
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }
  };

  // 处理搜索按钮点击
  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (results.length === 0 && !loading) {
        // 如果没有搜索结果且不在加载中，跳转到Google搜索
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`,
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        // 没有找到结果时跳转到Google搜索
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }
  };

  // 处理键盘导航
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    // 上箭头
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev <= 0 ? results.length - 1 : prev - 1));
    }
    // 下箭头
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev >= results.length - 1 ? 0 : prev + 1));
    }
    // Escape键
    else if (e.key === "Escape") {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  // 处理结果点击
  const handleResultClick = async (result: SearchResult) => {
    try {
      // 记录点击
      await fetch(`/api/services/${result.id}/click`, { method: "POST" });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("记录点击失败:", error);
      }
    }

    // 跳转到网站
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  // 点击外部关闭结果列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 滚动到选中的结果
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      // 获取结果项元素（考虑到我们添加了包装div）
      const resultItems =
        resultsRef.current.querySelectorAll("[data-result-item]");
      const selectedElement = resultItems[selectedIndex] as HTMLElement;

      if (selectedElement) {
        // 使用更精确的滚动方式
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  return (
    <>
      {/* 注入自定义滚动条样式 */}
      <style jsx global>
        {scrollbarStyles}
      </style>

      <div className="relative w-full">
        <form onSubmit={handleSubmit} className="relative w-full">
          <div
            className={`flex items-center ${
              isFocused || (showResults && results.length > 0)
                ? "bg-white shadow-md"
                : "bg-white/95"
            } border ${
              isFocused || (showResults && results.length > 0)
                ? "border-foreground/80 ring-2 ring-ring/30"
                : "border-border"
            } ${
              showResults && results.length > 0
                ? "rounded-tl-lg rounded-tr-lg rounded-bl-none rounded-br-none"
                : "rounded-lg"
            } overflow-hidden relative z-10`}
            style={{
              borderBottomWidth:
                showResults && results.length > 0 ? "0px" : "1px",
              marginBottom: showResults && results.length > 0 ? "1px" : "0px",
              transition: "background-color 0.2s, border-color 0.2s",
            }}
          >
            <div className="pl-3 text-muted-foreground">
              <SearchIcon className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (query.trim() && results.length > 0) {
                  setShowResults(true);
                }
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="搜索导航内容，找不到时会使用 Google 搜索..."
              className="w-full py-2 px-3 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={handleSearchButtonClick}
                className="w-20 m-0.5 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                搜索
              </button>
            )}
          </div>
        </form>

        {/* 搜索结果下拉框 - 与搜索框完全融合 */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute w-full bg-popover overflow-hidden custom-scrollbar max-h-80 overflow-y-auto border border-foreground/80 rounded-b-lg z-0 shadow-lg"
            style={{
              top: "calc(100% - 1px)",
              borderTopWidth: "0",
              transition: "none",
            }}
          >
            <div>
              {results.map((result, index) => (
                <div
                  key={result.id}
                  data-result-item
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/60"
                  }`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-shrink-0 w-10 h-10 relative">
                      {result.icon ? (
                        <Image
                          src={result.icon}
                          alt={result.name}
                          fill
                          className="rounded-lg object-contain p-0.5"
                          unoptimized={result.icon.endsWith(".svg")}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-foreground font-medium">
                          {result.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground flex items-center">
                        {result.name}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {result.description}
                      </div>
                    </div>
                    <div className="px-3 py-1 text-xs font-normal rounded-full flex items-center text-muted-foreground bg-muted">
                      {result.categoryName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 加载指示器 */}
        {loading && (
          <div className="absolute right-24 top-2.5">
            <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
}
