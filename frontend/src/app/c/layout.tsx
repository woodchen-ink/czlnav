import PublicSiteShell from "@/components/PublicSiteShell";
import { getSettings } from "@/lib/site-data";

export default function CategoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteName, siteDescription, statisticsCode } = getSettings();
  return (
    <PublicSiteShell settings={{ siteName, siteDescription, statisticsCode }}>
      {children}
    </PublicSiteShell>
  );
}
