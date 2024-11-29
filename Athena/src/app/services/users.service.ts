import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where  } from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IUser } from '../models/IUser';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  firestore = inject(Firestore);
  usersCollection = collection(this.firestore, 'users');
  add(user: IUser): Observable<string>{
    const userDocRef = doc(this.usersCollection, user.id);

    return from(setDoc(userDocRef, user)).pipe(
      map(() => user.id),
      catchError(error => {
        console.error('Error adding user:', error);
        throw error;
      })
    );
  }

  getAll(): Observable<IUser[]>{
    return collectionData(this.usersCollection, {
      idField: 'id',
    }) as Observable<IUser[]>;
  }

  getById(userId:string): Observable<IUser | null>{
    const userDocRef = doc(this.usersCollection, userId);
    return docData(userDocRef, { 
      idField: 'id' 
    }).pipe(
      map(user => user ? user as IUser : null),
      catchError(() => of(null))
    );
  }

  updateById(userId: string, userData: Partial<Omit<IUser, 'id'>>): Observable<void> {
    const userDocRef = doc(this.usersCollection, userId);
    return from(updateDoc(userDocRef, userData)).pipe(
      catchError(error => {
        console.error('Error updating user:', error);
        throw error;
      })
    );
  }

  deleteById(userId:string){
    const userDocRef = doc(this.usersCollection, userId);
    return from(deleteDoc(userDocRef)).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        throw error;
      })
    );
  }
  
  findUsersByMajor(major: string): Observable<IUser[]> {
    const usersQuery = query(
      this.usersCollection, 
      where('major', '==', major)
    );
    
    return collectionData(usersQuery, { 
      idField: 'id' 
    }) as Observable<IUser[]>;
  }

}
