import { LostPetPoster } from "./lost-pet-basic";
import { LostPetPremium } from "./lost-pet-premium";
import type { PosterData } from "./lost-pet-basic";

export type { PosterData };

export interface PosterTemplate {
  id: string;
  namePt: string;
  nameEn: string;
  tier: "free" | "premium" | "pro";
  component: (props: PosterData) => React.JSX.Element;
}

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: "basic",
    namePt: "Básico",
    nameEn: "Basic",
    tier: "free",
    component: LostPetPoster,
  },
  {
    id: "premium-purple",
    namePt: "Premium Roxo",
    nameEn: "Premium Purple",
    tier: "premium",
    component: LostPetPremium,
  },
];

export function getTemplate(id: string): PosterTemplate | undefined {
  return POSTER_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesForPlan(planSlug: string): PosterTemplate[] {
  switch (planSlug) {
    case "pro":
      return POSTER_TEMPLATES; // all templates
    case "premium":
      return POSTER_TEMPLATES.filter((t) => t.tier !== "pro");
    default:
      return POSTER_TEMPLATES.filter((t) => t.tier === "free");
  }
}
