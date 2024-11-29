import { Timestamp } from "@angular/fire/firestore";

export interface IUser{
    id:string;
    name:string;
    tel:string;
    email:string;
    password:string;
    major:string;
    start:number;
    rang:string;
}