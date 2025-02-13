/*export interface Curriculum {
    courseId:string,
    name:string,
    major:string,
    category:string,
    specialization:string
}*/

import { Specialization } from "./special";

export interface Curriculum {
    id:number|null,
    name:string,
    specializations: Specialization[]
}


