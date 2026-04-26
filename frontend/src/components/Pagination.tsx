"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams?: Record<string, string>;
  pageMode?: "path" | "query";
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
  pageMode = "path",
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const getPageUrl = (page: number) => {
    if (pageMode === "path" && Object.keys(queryParams).length === 0) {
      return page === 1 ? baseUrl : `${baseUrl}/p/${page}`;
    }

    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && key !== "page") params.append(key, value);
    });

    if (page !== 1) {
      params.append("page", page.toString());
    }

    const queryString = params.toString();
    if (queryString) {
      return `${baseUrl}?${queryString}`;
    }
    return baseUrl;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2">
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="px-3 py-2 rounded-md shadow-sm bg-white/80 text-foreground/70 hover:bg-white hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-md shadow-sm bg-white/60 text-foreground/30 cursor-not-allowed">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </span>
      )}

      {pageNumbers[0] > 1 && (
        <>
          <Link
            href={getPageUrl(1)}
            className="px-3 py-2 rounded-md shadow-sm bg-white/80 text-foreground/70 hover:bg-white hover:text-foreground transition-colors"
          >
            1
          </Link>
          {pageNumbers[0] > 2 && (
            <span className="px-3 py-2 text-white/50">...</span>
          )}
        </>
      )}

      {pageNumbers.map(page => (
        <Link
          key={page}
          href={getPageUrl(page)}
          className={`px-3 py-2 rounded-md shadow-sm ${
            page === currentPage
              ? "font-medium bg-foreground text-background"
              : "bg-white/80 text-foreground/70 hover:bg-white hover:text-foreground"
          } transition-colors`}
        >
          {page}
        </Link>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 py-1 text-white/50">...</span>
          )}
          <Link
            href={getPageUrl(totalPages)}
            className="px-3 py-2 rounded-md shadow-sm bg-white/80 text-foreground/70 hover:bg-white hover:text-foreground transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="px-3 py-2 rounded-md shadow-sm bg-white/80 text-foreground/70 hover:bg-white hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-md shadow-sm bg-white/60 text-foreground/30 cursor-not-allowed">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      )}
    </div>
  );
}
