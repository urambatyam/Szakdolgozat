import { PaginatedResponse } from "./paginationResponse";
import { Semester } from "./semester"

/**
 * A jegyekhez  tartozó model
 */
export interface Grade {
    id?:number,
    user_code:string,
    course_id:number,
    course_name?:string,
    grade:number|null,

}
/**
 * A szervertől kapot válasz leiró model
 */
export interface GradeApiResponse {
    grades: PaginatedResponse<Grade>; 
    semesters: Semester[];       
}