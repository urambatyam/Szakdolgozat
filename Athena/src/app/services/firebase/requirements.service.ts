import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where  } from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Requirements } from '../models/requirements';

@Injectable({
  providedIn: 'root'
})
export class RequirementsService {
    firestore = inject(Firestore);
    requirementsCollection = collection(this.firestore, 'requirements');

      add(requirements: Requirements): Observable<string>{
        const requirementsDocRef = doc(this.requirementsCollection, requirements.id);
    
        return from(setDoc(requirementsDocRef, requirements)).pipe(
          map(() => requirements.id),
          catchError(error => {
            console.error('Error adding requirements:', error);
            throw error;
          })
        );
      }
    
      getAll(): Observable<Requirements[]>{
        return collectionData(this.requirementsCollection, {
          idField: 'id',
        }) as Observable<Requirements[]>;
      }
    
      getById(requirementsId:string): Observable<Requirements | null>{
        const requirementsDocRef = doc(this.requirementsCollection, requirementsId);
        return docData(requirementsDocRef, { 
          idField: 'id' 
        }).pipe(
          map(requirements => requirements ? requirements as Requirements : null),
          catchError(() => of(null))
        );
      }
    
      updateById(requirementsId: string, requirementsData: Partial<Omit<Requirements, 'id'>>): Observable<void> {
        const requirementsDocRef = doc(this.requirementsCollection, requirementsId);
        return from(updateDoc(requirementsDocRef, requirementsData)).pipe(
          catchError(error => {
            console.error('Error updating requirements:', error);
            throw error;
          })
        );
      }
    
      deleteById(requirementsId:string){
        const requirementsDocRef = doc(this.requirementsCollection, requirementsId);
        return from(deleteDoc(requirementsDocRef)).pipe(
          catchError(error => {
            console.error('Error deleting requirements:', error);
            throw error;
          })
        );
      }

}
