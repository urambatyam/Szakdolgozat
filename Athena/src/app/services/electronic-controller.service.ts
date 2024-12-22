import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, query, where  } from '@angular/fire/firestore';
import { Observable,from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ElectronicController } from '../models/electronic-controller';

@Injectable({
  providedIn: 'root'
})
export class ElectronicControllerService {
    firestore = inject(Firestore);
    ElectronicControllersCollection = collection(this.firestore, 'ElectronicControllers');

      add(ElectronicControllers: ElectronicController): Observable<void>{
        const ElectronicControllersDocRef = doc(this.ElectronicControllersCollection);
    
        return from(setDoc(ElectronicControllersDocRef, ElectronicControllers));
      }
    
      getAll(): Observable<ElectronicController[]>{
        return collectionData(this.ElectronicControllersCollection, {
          idField: 'id',
        }) as Observable<ElectronicController[]>;
      }
    
      getById(ElectronicControllersId:string): Observable<ElectronicController | null>{
        const ElectronicControllersDocRef = doc(this.ElectronicControllersCollection, ElectronicControllersId);
        return docData(ElectronicControllersDocRef, { 
          idField: 'id' 
        }).pipe(
          map(ElectronicControllers => ElectronicControllers ? ElectronicControllers as ElectronicController : null),
          catchError(() => of(null))
        );
      }
    
      updateById(ElectronicControllersId: string, ElectronicControllersData: Partial<Omit<ElectronicController, 'id'>>): Observable<void> {
        const ElectronicControllersDocRef = doc(this.ElectronicControllersCollection, ElectronicControllersId);
        return from(updateDoc(ElectronicControllersDocRef, ElectronicControllersData)).pipe(
          catchError(error => {
            console.error('Error updating ElectronicControllers:', error);
            throw error;
          })
        );
      }
    
      deleteById(ElectronicControllersId:string){
        const ElectronicControllersDocRef = doc(this.ElectronicControllersCollection, ElectronicControllersId);
        return from(deleteDoc(ElectronicControllersDocRef)).pipe(
          catchError(error => {
            console.error('Error deleting ElectronicControllers:', error);
            throw error;
          })
        );
      }
}
