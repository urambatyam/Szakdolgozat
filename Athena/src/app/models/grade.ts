
export interface Grade {
    id?:number,
    user_code:string,
    course_id:number,
    course_name?:string,
    grade:number|null,
}