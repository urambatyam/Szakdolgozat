export interface Course {
    id?:string|number|null,
    recommendedSemester:number,
    subjectResponsible?: string,
    user_code?: string | null,
    name:string,
    kredit:number,
    subjectMatter:string,
    //requirementsId:string
}


