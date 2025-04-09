export interface Optimalization {
    "curriculum_id": number,
    "algorithm": "bnb" | "greedy",
    "creditLimit": number,
    "selectedSpecializationIds": Array<number>,
    "considerRecommendations": boolean,
    "negativIds": Array<number>,
    "pozitivIds": Array<number>
}

export interface Course {
  id: number;
  name: string;
  kredit: number;
}

export interface Semester {
  is_fall: boolean;
  courses: Course[];
  total_credits: number;
}

export interface OptimizedPlan {
  semesters: Semester[];
  total_credits: number;
  total_courses: number;
  total_semesters: number;
  all_requirements_met: boolean;
  nodes_explored?: number;
}