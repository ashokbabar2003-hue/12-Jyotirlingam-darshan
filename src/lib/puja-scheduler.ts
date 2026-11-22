/**
 * Hybrid puja-aware schedule planner (staging, dry-run).
 * IST is fixed at UTC+05:30; Cloudflare cron timestamps are UTC.
 * Only official-source verified events are enabled. Unverified shrines
 * receive a low-frequency fallback slot, not invented puja times.
 */
export type ScheduleReason = "puja" | "fallback";
export interface ScheduledShrine { slug: string; reason: ScheduleReason; event?: string; }
type Puja = { time: string; name: string; source: string };
const VERIFIED_PUJAS: Record<string, Puja[]> = {
  somnath: [
    { time: "07:00", name: "Morning Aarti", source: "https://somnath.org/faq/" },
    { time: "12:00", name: "Midday Aarti", source: "https://somnath.org/faq/" },
    { time: "19:00", name: "Evening Aarti", source: "https://somnath.org/faq/" },
  ],
  "kashi-vishwanath": [
    { time: "02:45", name: "Mangala Aarti", source: "https://www.shrikashivishwanath.org/notification" },
    { time: "11:30", name: "Bhog Aarti", source: "https://www.shrikashivishwanath.org/notification" },
    { time: "19:00", name: "Sapta Rishi Aarti", source: "https://www.shrikashivishwanath.org/notification" },
    { time: "21:00", name: "Shringar Aarti", source: "https://www.shrikashivishwanath.org/notification" },
  ],
};
export const SCHEDULE_SHRINES = [
  "somnath", "mallikarjuna", "mahakaleshwar", "omkareshwar",
  "kedarnath", "bhimashankar", "kashi-vishwanath", "trimbakeshwar",
  "baidyanath", "nageshwar", "rameshwaram", "grishneshwar",
] as const;
const toMinutes = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};
export function getHybridSchedule(now: Date): ScheduledShrine[] {
  const ist = new Date(now.getTime() + 330 * 60_000);
  const minute = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  if (minute % 5 !== 0) return [];
  const due: ScheduledShrine[] = [];
  for (const slug of SCHEDULE_SHRINES) {
    const events = VERIFIED_PUJAS[slug] ?? [];
    const matched = events.find((event) => {
      const delta = (minute - toMinutes(event.time) + 1440) % 1440;
      return delta === 1425 || delta === 0 || delta === 15;
    });
    if (matched) {
      due.push({ slug, reason: "puja", event: matched.name });
    } else if (minute % 180 === 0) {
      due.push({ slug, reason: "fallback" });
    }
  }
  return due;
}
export const VERIFIED_SCHEDULE_SOURCES = VERIFIED_PUJAS;
