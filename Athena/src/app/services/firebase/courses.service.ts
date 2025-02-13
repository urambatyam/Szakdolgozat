import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where} from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Course } from '../../models/course';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
    firestore = inject(Firestore);
    CoursesCollection = collection(this.firestore, 'course');

      add(Courses: Course){
        /*const CoursesDocRef = doc(this.CoursesCollection, Courses.name);
    
        return from(setDoc(CoursesDocRef, Courses)).pipe(
          map(() => Courses.name),
          catchError(error => {
            console.error('Error adding Courses:', error);
            throw error;
          })
        );*/
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

      getByName(name:string): Observable<Course | null>{
        const q = query(this.CoursesCollection, where("name", "==", name));
        return collectionData(q, { idField: 'id' }) as Observable<Course>;
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

      updateByName(courseName: string, courseData: Partial<Course>): Observable<void> {
        const courseDocRef = doc(this.CoursesCollection, courseName);
        return from(updateDoc(courseDocRef, courseData));
    }

    deleteByName(courseName: string): Observable<void> {
        const courseDocRef = doc(this.CoursesCollection, courseName);
        return from(deleteDoc(courseDocRef));
    }
}