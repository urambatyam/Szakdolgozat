import { Category } from "./category";
/**
 * A tantervhez tartozó specializáció modelje
 */
export interface Specialization {
    id:number|null,
    name:string,
    required:boolean,
    min?:number,
    categories: Category[],
}

