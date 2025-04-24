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