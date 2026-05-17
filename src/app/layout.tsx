import type { Metadata } from "next";
import { Bebas_Neue, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://expressitstudios.com"),
  title: {
    default: "ExpressIt Studios — Cinematic Photo & Memory Creations",
    template: "%s — ExpressIt Studios",
  },
  description:
    "Custom AI-generated videos from your photos. Business product ads and personal memory films delivered in 24–48 hours.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ExpressIt Studios",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${geist.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-on-surface min-h-full flex flex-col selection:bg-primary/30">
        <SiteHeader />
        <div className="flex-1 flex flex-col pt-20">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
