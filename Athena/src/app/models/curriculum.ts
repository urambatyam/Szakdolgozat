/*export interface Curriculum {
    courseId:string,
    name:string,
    major:string,
    category:string,
    specialization:string
}*/

import { Specialization } from "./special";

export interface Curriculum {
    name:string,
    specializations: Specialization[]
}


