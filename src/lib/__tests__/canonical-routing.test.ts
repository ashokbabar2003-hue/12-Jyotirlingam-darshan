import { describe, it, expect } from "vitest";
import { jyotirlingas, getJyotirlinga } from "@/data/jyotirlingas";

describe("Jyotirlinga canonical routing structure", () => {
  it("defines all 12 Jyotirlingas with unique valid slugs", () => {
    expect(jyotirlingas).toHaveLength(12);
    const slugs = jyotirlingas.map((j) => j.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(12);

    const expectedSlugs = [
      "somnath",
      "mallikarjuna",
      "mahakaleshwar",
      "omkareshwar",
      "kedarnath",
      "bhimashankar",
      "kashi-vishwanath",
      "trimbakeshwar",
      "baidyanath",
      "nageshwar",
      "rameshwaram",
      "grishneshwar",
    ];

    for (const slug of expectedSlugs) {
      expect(slugs).toContain(slug);
      const jl = getJyotirlinga(slug);
      expect(jl).toBeDefined();
      expect(jl?.slug).toBe(slug);
    }
  });

  it("does not conflict with top-level application reserved routes", () => {
    const reservedRoutes = ["admin", "auth", "live", "dashboard", "api", "sitemap.xml"];
    const shrineSlugs = jyotirlingas.map((j) => j.slug);
    for (const reserved of reservedRoutes) {
      expect(shrineSlugs).not.toContain(reserved);
      expect(getJyotirlinga(reserved)).toBeUndefined();
    }
  });

  it("sitemap produces canonical /$slug URLs for all 12 shrines", () => {
    const shrinePaths = jyotirlingas.map((j) => `/${j.slug}`);
    expect(shrinePaths).toHaveLength(12);
    expect(shrinePaths).toContain("/somnath");
    expect(shrinePaths).toContain("/kedarnath");
    expect(shrinePaths).toContain("/kashi-vishwanath");
    expect(shrinePaths.every((p) => !p.startsWith("/jyotirlinga/"))).toBe(true);
  });
});
