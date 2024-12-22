import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where  } from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Curriculum } from '../models/curriculum';

@Injectable({
  providedIn: 'root'
})
export class CurriculumsService {
    firestore = inject(Firestore);
    curriculumssCollection = collection(this.firestore, 'curriculumss');

      add(curriculumss: Curriculum): Observable<void>{
        const curriculumssDocRef = doc(this.curriculumssCollection);
    
        return from(setDoc(curriculumssDocRef, curriculumss));
      }
    
      getAll(): Observable<Curriculum[]>{
        return collectionData(this.curriculumssCollection, {
          idField: 'id',
        }) as Observable<Curriculum[]>;
      }
    
      getById(curriculumssId:string): Observable<Curriculum | null>{
        const curriculumssDocRef = doc(this.curriculumssCollection, curriculumssId);
        return docData(curriculumssDocRef, { 
          idField: 'id' 
        }).pipe(
          map(curriculumss => curriculumss ? curriculumss as Curriculum : null),
          catchError(() => of(null))
        );
      }
    
      updateById(curriculumssId: string, curriculumssData: Partial<Omit<Curriculum, 'id'>>): Observable<void> {
        const curriculumssDocRef = doc(this.curriculumssCollection, curriculumssId);
        return from(updateDoc(curriculumssDocRef, curriculumssData)).pipe(
          catchError(error => {
            console.error('Error updating curriculumss:', error);
            throw error;
          })
        );
      }
    
      deleteById(curriculumssId:string){
        const curriculumssDocRef = doc(this.curriculumssCollection, curriculumssId);
        return from(deleteDoc(curriculumssDocRef)).pipe(
          catchError(error => {
            console.error('Error deleting curriculumss:', error);
            throw error;
          })
        );
      }
}
