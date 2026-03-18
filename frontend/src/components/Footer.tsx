"use client";

type FooterProps = {
  siteDescription?: string;
  statisticsCode?: string;
};

export default function Footer({
  siteDescription,
  statisticsCode,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="py-6 text-sm">
        <div className="container mx-auto px-4 max-w-[960px]">
          <div className="text-center text-gray-500 mt-2">
            <p>&copy; {year} CZL LTD. All Rights Reserved</p>
            {siteDescription && <p className="mt-2">{siteDescription}</p>}
          </div>
        </div>
      </footer>

      {/* 统计代码 */}
      {statisticsCode && (
        <div dangerouslySetInnerHTML={{ __html: statisticsCode }} />
      )}
    </>
  );
}
