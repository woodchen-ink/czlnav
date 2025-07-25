import "../globals.css";
import { getSiteSettings } from "@/utils/settings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar siteName={settings.siteName || "CZL Nav"} />
      <main className="flex-grow">{children}</main>
      <script
        defer
        src="https://analytics.czl.net/script.js"
        data-website-id="5703b793-bb32-42df-9bd5-37a43c78f399"
      ></script>
      <Footer
        siteDescription={settings.siteDescription}
        statisticsCode={settings.statisticsCode}
      />
    </div>
  );
}
