import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where, getDocs, DocumentReference  } from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map, switchMap  } from 'rxjs/operators';
import { Curriculum } from '../models/curriculum';
import { Name } from '../models/curriculumNames';

@Injectable({
  providedIn: 'root'
})
export class CurriculumsService {
    firestore = inject(Firestore);
    curriculumssCollection = collection(this.firestore, 'curriculum');
    curriculumsNamesCollection = collection(this.firestore, 'curriculumNames');

      add(curriculumss: Curriculum): Observable<void>{
        const curriculumssDocRef = doc(this.curriculumssCollection);
    
        return from(setDoc(curriculumssDocRef, curriculumss));
      }
    
      getAll(): Observable<Curriculum[]>{
        return collectionData(this.curriculumssCollection, {
          idField: 'id',
        }) as Observable<Curriculum[]>;
      }      
      getAllNames(): Observable<Name[]>{
        return collectionData(this.curriculumsNamesCollection, {
          idField: 'id',
        }) as Observable<Name[]>;
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
      
      getByNames(name: string): Observable<Curriculum[]> {
        const q = query(this.curriculumssCollection, where("name", "==", name));
        return collectionData(q, { idField: 'id' }) as Observable<Curriculum[]>;
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

      deleteByName(curriculumsName:string){
        const q = query(this.curriculumssCollection, where("name", "==", curriculumsName));
        const q2 = query(this.curriculumsNamesCollection, where("name", "==", curriculumsName));
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
