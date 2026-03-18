import { Suspense } from "react";
import CategoryPageClient from "@/components/CategoryPageClient";

export default function CategoryShellPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          正在加载分类内容...
        </div>
      }
    >
      <CategoryPageClient />
    </Suspense>
  );
}
