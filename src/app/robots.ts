import type { MetadataRoute } from "next";

const SITE_URL = "https://expressitstudios.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout/success"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
