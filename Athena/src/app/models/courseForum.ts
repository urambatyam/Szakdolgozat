/**
 * A kurzus forumhoz üzeneteihez tartozó model
 */
export interface CourseForum {
    id?:string,
    user_code?:string,
    course_id:number,
    message:string,
    created_at?:string
}