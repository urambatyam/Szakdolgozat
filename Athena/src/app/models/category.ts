import { MatTableDataSource } from "@angular/material/table";
import { Course } from "./course";

export interface Kategoria {
    courseIds:MatTableDataSource<Course>,
    name:string,
}

export interface Category {
    id?: number,
    courses: string[],
    name:string,
    courseMatdata?:MatTableDataSource<Course>
}

export interface CategoryTable  extends Category {
    courseMatdata:MatTableDataSource<Course>
}

