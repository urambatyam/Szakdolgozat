/**
 * A kurzus forúm üzenetihez tartozó model
 */
export interface Forum {
    id:string,
    userId:string,
    courseId:number,
    date:Date,
    message:string
}
