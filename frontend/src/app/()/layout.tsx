import PublicSiteShell from "@/components/PublicSiteShell";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
