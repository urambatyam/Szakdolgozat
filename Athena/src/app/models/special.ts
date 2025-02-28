import { Category } from "./category";

export interface Specialization {
    id:number|null,
    name:string,
    min?:number,
    categories: Category[],
}

