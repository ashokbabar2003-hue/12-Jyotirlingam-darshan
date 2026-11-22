import { describe, expect, it } from "vitest";
import { getHybridSchedule } from "../puja-scheduler";
const atIST = (date: string, clock: string) => new Date(`${date}T${clock}:00+05:30`);
describe("hybrid puja schedule planner", () => {
  it("schedules Somnath 15 minutes before aarti", () => {
    expect(getHybridSchedule(atIST("2026-11-23", "06:45"))).toContainEqual({
      slug: "somnath", reason: "puja", event: "Morning Aarti",
    });
  });
  it("schedules Kashi Vishwanath at Mangala Aarti start", () => {
    expect(getHybridSchedule(atIST("2026-11-23", "02:45"))).toContainEqual({
      slug: "kashi-vishwanath", reason: "puja", event: "Mangala Aarti",
    });
  });
  it("includes all shrines in three-hour fallback window", () => {
    expect(getHybridSchedule(atIST("2026-11-23", "06:00"))).toHaveLength(12);
  });
  it("does not schedule on arbitrary minutes", () => {
    expect(getHybridSchedule(atIST("2026-11-23", "06:02"))).toEqual([]);
  });
  it("does not invent puja events for unverified shrines", () => {
    expect(getHybridSchedule(atIST("2026-11-23", "06:45")).find(x => x.slug === "grishneshwar")).toBeUndefined();
  });
});
