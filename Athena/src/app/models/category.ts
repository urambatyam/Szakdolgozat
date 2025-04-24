import { Course } from "./course";
/**
 * A kategoriához tartozó model
 */
export interface Category {
    id: number | null,
    courses: Course[],
    name:string,
    min:number,
    max?:number,
}