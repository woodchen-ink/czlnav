import PublicSiteShell from "@/components/PublicSiteShell";

export default function CategoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
