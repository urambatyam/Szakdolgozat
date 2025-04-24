/**
 * A kurzus tágytematikájának modelje
 */
export interface SubjectMatter {
    id:number|null,
    course_id:number|null,
    topic:string|null,
    goal:string|null,
    requirements:string|null
}