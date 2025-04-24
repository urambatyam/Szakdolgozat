
import { Specialization } from "./special";
/**
 * A tantervhez tartozó model
 */
export interface Curriculum {
    id:number|null,
    name:string,
    specializations: Specialization[]
}


