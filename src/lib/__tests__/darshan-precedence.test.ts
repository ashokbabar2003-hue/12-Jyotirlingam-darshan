import { describe, it, expect } from "vitest";
import { resolveShrineStreams, resolveAllShrineStreams } from "@/lib/darshan-precedence";
import { jyotirlingas, type Jyotirlinga } from "@/data/jyotirlingas";

describe("Darshan stream resolution precedence", () => {
  const sampleShrine: Jyotirlinga = {
    number: 1,
    name: "Somnath",
    slug: "somnath",
    deity: "Shiva",
    state: "Gujarat",
    location: "Prabhas Patan, Veraval",
    river: "Triveni Sangam",
    image: "/images/somnath.jpg",
    fallbackImage: "/images/somnath-fallback.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=stat_live_1",
    defaultYoutubeUrl: "https://www.youtube.com/watch?v=stat_rec__1",
    description: "First among the twelve Jyotirlingas.",
    significance: "Sacred shrine of the moon god.",
    jyotirlingaStory: "Story of Somnath...",
    historyStory: "History of Somnath...",
    aartiTimings: [],
    majorFestivals: [],
  };

  it("prioritizes valid live DB link over default and static fallback", () => {
    const dbLinks = {
      somnath: "https://www.youtube.com/watch?v=db_live_123",
      somnath__default: "https://www.youtube.com/watch?v=db_rec_1234",
    };

    const resolved = resolveShrineStreams(sampleShrine, dbLinks);
    expect(resolved.status).toBe("live");
    expect(resolved.liveUrl).toContain("db_live_123");
    expect(resolved.defaultUrl).toContain("db_rec_1234");
  });

  it("falls back to db default link when live link is empty or invalid", () => {
    const dbLinks = {
      somnath: "", // empty live
      somnath__default: "https://www.youtube.com/watch?v=db_rec_1234",
    };

    const resolved = resolveShrineStreams(sampleShrine, dbLinks);
    expect(resolved.status).toBe("recorded");
    expect(resolved.liveUrl).toBeNull();
    expect(resolved.defaultUrl).toContain("db_rec_1234");
  });

  it("falls back to static defaults if DB links are empty", () => {
    const resolved = resolveShrineStreams(sampleShrine, {});
    expect(resolved.status).toBe("live");
    expect(resolved.liveUrl).toContain("stat_live_1");
    expect(resolved.defaultUrl).toContain("stat_rec__1");
  });

  it("resolves all 12 shrines consistently", () => {
    const dbLinks = {
      somnath: "https://www.youtube.com/watch?v=fbwQFRDLUpM",
      somnath__default: "https://www.youtube.com/watch?v=2THptwHClhs",
    };

    const all = resolveAllShrineStreams(jyotirlingas, dbLinks);
    expect(Object.keys(all)).toHaveLength(12);
    expect(all.somnath.status).toBe("live");
    expect(all.somnath.liveUrl).toContain("fbwQFRDLUpM");
    expect(all.somnath.defaultUrl).toContain("2THptwHClhs");
  });
});
