import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where  } from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Forum } from '../models/forum';

@Injectable({
  providedIn: 'root'
})
export class ForumsService {
    firestore = inject(Firestore);
    forumsCollection = collection(this.firestore, 'forums');

      add(forums: Forum): Observable<string>{
        const forumsDocRef = doc(this.forumsCollection, forums.id);
    
        return from(setDoc(forumsDocRef, forums)).pipe(
          map(() => forums.id),
          catchError(error => {
            console.error('Error adding forums:', error);
            throw error;
          })
        );
      }
    
      getAll(): Observable<Forum[]>{
        return collectionData(this.forumsCollection, {
          idField: 'id',
        }) as Observable<Forum[]>;
      }
    
      getById(forumsId:string): Observable<Forum | null>{
        const forumsDocRef = doc(this.forumsCollection, forumsId);
        return docData(forumsDocRef, { 
          idField: 'id' 
        }).pipe(
          map(forums => forums ? forums as Forum : null),
          catchError(() => of(null))
        );
      }
    
      updateById(forumsId: string, forumsData: Partial<Omit<Forum, 'id'>>): Observable<void> {
        const forumsDocRef = doc(this.forumsCollection, forumsId);
        return from(updateDoc(forumsDocRef, forumsData)).pipe(
          catchError(error => {
            console.error('Error updating forums:', error);
            throw error;
          })
        );
      }
    
      deleteById(forumsId:string){
        const forumsDocRef = doc(this.forumsCollection, forumsId);
        return from(deleteDoc(forumsDocRef)).pipe(
          catchError(error => {
            console.error('Error deleting forums:', error);
            throw error;
          })
        );
      }
}