// Filter metadata for the interactive dashboard. Keyed by slug.

export type Zone = "North" | "South" | "East" | "West" | "Central";
export type Difficulty = "Easy" | "Medium" | "Challenging Trek";

export interface JyotirlingaMeta {
  zone: Zone;
  difficulty: Difficulty;
  /** Approx elevation in metres — handy context for the difficulty rating. */
  elevation: number;
}

export const jyotirlingaMeta: Record<string, JyotirlingaMeta> = {
  somnath: { zone: "West", difficulty: "Easy", elevation: 5 },
  mallikarjuna: { zone: "South", difficulty: "Medium", elevation: 476 },
  mahakaleshwar: { zone: "Central", difficulty: "Easy", elevation: 491 },
  omkareshwar: { zone: "Central", difficulty: "Medium", elevation: 196 },
  kedarnath: { zone: "North", difficulty: "Challenging Trek", elevation: 3583 },
  bhimashankar: { zone: "West", difficulty: "Medium", elevation: 1034 },
  "kashi-vishwanath": { zone: "North", difficulty: "Easy", elevation: 80 },
  trimbakeshwar: { zone: "West", difficulty: "Easy", elevation: 721 },
  baidyanath: { zone: "East", difficulty: "Easy", elevation: 254 },
  nageshwar: { zone: "West", difficulty: "Easy", elevation: 10 },
  rameshwaram: { zone: "South", difficulty: "Easy", elevation: 10 },
  grishneshwar: { zone: "West", difficulty: "Easy", elevation: 600 },
};

export const ZONES: Zone[] = ["North", "South", "East", "West", "Central"];
export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Challenging Trek"];
