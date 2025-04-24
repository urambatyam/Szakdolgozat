/**
 * A optimalizálási alagorimushoz lekérdezéseihez tartozó model
 */
export interface Optimalization {
    "curriculum_id": number,
    "algorithm": "bnb" | "greedy",
    "creditLimit": number,
    "selectedSpecializationIds": Array<number>,
    "considerRecommendations": boolean,
    "negativIds": Array<number>,
    "pozitivIds": Array<number>
}

/**
 * Az OptimizedPlan-nek szükséges segéd interface Kurzus model legyszerüsotése
 */
interface Course {
  id: number;
  name: string;
  kredit: number;
}
/**
 * Az optimalizáláshoz használt félév model ami tartalmaza a hozá tartozó kurzusokat.
 */
export interface Semester {
  is_fall: boolean;
  courses: Course[];
  total_credits: number;
}
/**
 * Az optimalizálásból vissza kapot választ leiró model ami a tartalmaza az optimalizált tantervet.
 */
export interface OptimizedPlan {
  semesters: Semester[];
  total_credits: number;
  total_courses: number;
  total_semesters: number;
  all_requirements_met: boolean;
  nodes_explored?: number;
}
/**
 * A szervertől viszakapto válasz ami azoptimális tantervet és a kredit megoszlást tartalmaza
 */
export interface OptimizedPlanResponse {
  optimizedPlan: OptimizedPlan;
  creditsBreakdown: any,
  warnings?: string[];
}