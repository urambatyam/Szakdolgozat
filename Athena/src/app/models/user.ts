import { Timestamp } from "@angular/fire/firestore";

export interface User{
    id:string;
    name:string;
    tel:string;
    email:string;
    password:string;
    major:string;
    start:number;
    rang:string;
}