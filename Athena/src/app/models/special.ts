import { Category } from "./category";

export interface Specialization {
    id:number|null,
    name:string,
    required:boolean,
    min?:number,
    categories: Category[],
}

