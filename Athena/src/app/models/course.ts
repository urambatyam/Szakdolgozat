export interface Course {
    id:number|null,
    recommendedSemester:number|null,
    subjectResponsible: string|null,
    user_code: string | null,
    name:string|null,
    kredit:number|null,
    subjectMatter:string|null,
    sezon:boolean|null,
    completed?:boolean,
    applied?:boolean,
    subjectMatterId?:number|null,
    prerequisites?:any,
    pre?:any,
}


