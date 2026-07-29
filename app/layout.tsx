import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, organizationJsonLd, siteConfig } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  category: "real estate",
  formatDetection: { email: false, address: false, telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.language}>
      <body>
        <JsonLd data={organizationJsonLd()} />
        {children}
      </body>
    </html>
  );
}
