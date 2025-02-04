/*export interface Curriculum {
    courseId:string,
    name:string,
    major:string,
    category:string,
    specialization:string
}*/

import { Specialization } from "./special";

export interface Curriculum {
    id?:number,
    name:string,
    specializations: Specialization[]
}


