export interface User{
    code?:string;
    name:string;
    email: string;
    role:'student'|'teacher'|'admin';
    curriculum_id:number|null;
}