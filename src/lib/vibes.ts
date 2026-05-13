// Curated vibe menu shown on the upload page. Business product video ads
// only — personal memory videos don't surface a vibe picker (the occasion
// option picked at checkout drives style for those).

export type Vibe = {
  id: string;
  label: string;
  description: string;
};

export const BUSINESS_VIBES: Vibe[] = [
  {
    id: "punchy",
    label: "Punchy",
    description: "Fast cuts, hype energy — designed to stop the scroll.",
  },
  {
    id: "clean",
    label: "Clean",
    description: "Minimal, premium, Apple-style polish.",
  },
  {
    id: "trendy",
    label: "Trendy",
    description: "TikTok-style with captions and viral cadence.",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    description: "Slower, aspirational — your product in someone's life.",
  },
];

export function vibesForProduct(slug: string): Vibe[] {
  // Currently only the business product video ad surfaces a vibe picker.
  // Personal memory videos don't — occasion picked at checkout drives style.
  if (slug === "custom-product-video-ad") return BUSINESS_VIBES;
  return [];
}

export function isValidVibe(slug: string, vibe: string | null): boolean {
  if (vibe === null || vibe === "") return true; // optional
  return vibesForProduct(slug).some((v) => v.id === vibe);
}
