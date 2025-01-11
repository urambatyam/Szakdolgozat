import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc} from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Course } from '../models/course';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
    firestore = inject(Firestore);
    CoursesCollection = collection(this.firestore, 'course');

      add(Courses: Course): Observable<string>{
        const CoursesDocRef = doc(this.CoursesCollection, Courses.id);
    
        return from(setDoc(CoursesDocRef, Courses)).pipe(
          map(() => Courses.id),
          catchError(error => {
            console.error('Error adding Courses:', error);
            throw error;
          })
        );
      }
    
      getAll(): Observable<Course[]>{
        return collectionData(this.CoursesCollection, {
          idField: 'id',
        }) as Observable<Course[]>;
      }
    
      getById(CoursesId:string): Observable<Course | null>{
        const CoursesDocRef = doc(this.CoursesCollection, CoursesId);
        return docData(CoursesDocRef, { 
          idField: 'id' 
        }).pipe(
          map(Courses => Courses ? Courses as Course : null),
          catchError(() => of(null))
        );
      }
    
      updateById(CoursesId: string, CoursesData: Partial<Omit<Course, 'id'>>): Observable<void> {
        const CoursesDocRef = doc(this.CoursesCollection, CoursesId);
        return from(updateDoc(CoursesDocRef, CoursesData)).pipe(
          catchError(error => {
            console.error('Error updating Courses:', error);
            throw error;
          })
        );
      }
    
      deleteById(CoursesId:string){
        const CoursesDocRef = doc(this.CoursesCollection, CoursesId);
        return from(deleteDoc(CoursesDocRef)).pipe(
          catchError(error => {
            console.error('Error deleting Courses:', error);
            throw error;
          })
        );
      }
}