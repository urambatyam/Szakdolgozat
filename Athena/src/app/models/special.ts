import { Category } from "./category";

export interface Specialization {
    id:number|null,
    name:string,
    categories: Category[],
}

export interface Special2 {
    kats:Category[],
    name:string,
}