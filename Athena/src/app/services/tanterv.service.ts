import { inject, Injectable } from '@angular/core';
import { collection, collectionData, deleteDoc, doc, docData, Firestore, getDocs, query, setDoc, where, addDoc, updateDoc } from '@angular/fire/firestore';
import { catchError, from, map, mergeMap, Observable, of, throwError } from 'rxjs';
import { Curriculum } from '../models/curriculum';
import { Specialization } from '../models/special';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root'
})
export class TantervService {
  private readonly firestore = inject(Firestore);
  private readonly tantervCollection = collection(this.firestore, 'Curriculum');

  async add(curriculum: Curriculum): Promise<void> {
    try {
      // Create main curriculum document with auto-generated ID
      const curriculumRef = await addDoc(this.tantervCollection, { name: curriculum.name });
      const curriculumId = curriculumRef.id;

      for (const sp of curriculum.specializations) {
        // Create specialization with auto-generated ID
        const specCollectionRef = collection(this.firestore, `Curriculum/${curriculumId}/specializations`);
        const specRef = await addDoc(specCollectionRef, { name: sp.name });
        const specId = specRef.id;

        for (const cat of sp.categories) {
          // Create category with auto-generated ID
          const catCollectionRef = collection(this.firestore, `Curriculum/${curriculumId}/specializations/${specId}/categories`);
          await addDoc(catCollectionRef, {
            name: cat.name,
            courses: cat.courses,
          });
        }
      }
    } catch (error) {
      console.error('Error creating curriculum:', error);
      throw error;
    }
  }

  async update(curriculum: Curriculum): Promise<void> {
    try {
      // Find the curriculum document by name
      const q = query(this.tantervCollection, where("name", "==", curriculum.name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Curriculum not found');
      }

      const curriculumDoc = snapshot.docs[0];
      const curriculumId = curriculumDoc.id;

      // Update main curriculum document
      await updateDoc(doc(this.firestore, `Curriculum/${curriculumId}`), {
        name: curriculum.name
      });

      // First, delete all existing specializations and their categories
      const existingSpecsSnapshot = await getDocs(
        collection(this.firestore, `Curriculum/${curriculumId}/specializations`)
      );

      for (const specDoc of existingSpecsSnapshot.docs) {
        // Delete all categories
        const categoriesSnapshot = await getDocs(
          collection(this.firestore, `Curriculum/${curriculumId}/specializations/${specDoc.id}/categories`)
        );
        for (const catDoc of categoriesSnapshot.docs) {
          await deleteDoc(catDoc.ref);
        }
        // Delete the specialization
        await deleteDoc(specDoc.ref);
      }

      // Then create new specializations and categories
      for (const sp of curriculum.specializations) {
        const specCollectionRef = collection(this.firestore, `Curriculum/${curriculumId}/specializations`);
        const specRef = await addDoc(specCollectionRef, { name: sp.name });
        const specId = specRef.id;

        for (const cat of sp.categories) {
          const catCollectionRef = collection(this.firestore, `Curriculum/${curriculumId}/specializations/${specId}/categories`);
          await addDoc(catCollectionRef, {
            name: cat.name,
            courses: cat.courses,
          });
        }
      }
    } catch (error) {
      console.error('Error updating curriculum:', error);
      throw error;
    }
  }

  async addOrUpdate(curriculum: Curriculum): Promise<void> {
    // Check if curriculum already exists
    const q = query(this.tantervCollection, where("name", "==", curriculum.name));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // If doesn't exist, add new
      await this.add(curriculum);
    } else {
      // If exists, update
      await this.update(curriculum);
    }
  }

  getAllNames(): Observable<Curriculum[]> {
    return collectionData(this.tantervCollection, { idField: 'id' }) as Observable<Curriculum[]>;
  }

  getCurriculumByName(name: string): Observable<Curriculum | null> {
    const q = query(this.tantervCollection, where("name", "==", name));

    return from(getDocs(q)).pipe(
      mergeMap(async snapshot => {
        if (snapshot.empty) {
          return null;
        }

        const curriculumDoc = snapshot.docs[0];
        const curriculumData = curriculumDoc.data();

        const specializationsSnapshot = await getDocs(
          collection(this.firestore, `Curriculum/${curriculumDoc.id}/specializations`)
        );

        const specializations = await Promise.all(
          specializationsSnapshot.docs.map(async specDoc => {
            const specData = specDoc.data();
            const categoriesSnapshot = await getDocs(
              collection(this.firestore, `Curriculum/${curriculumDoc.id}/specializations/${specDoc.id}/categories`)
            );

            const categories = categoriesSnapshot.docs.map(catDoc => ({
              name: catDoc.data()['name'],
              courses: catDoc.data()['courses'] || []
            }));

            return {
              name: specData['name'],
              categories
            };
          })
        );

        return {
          name: curriculumData['name'],
          specializations
        };
      }),
      catchError(error => {
        console.error('Error fetching curriculum:', error);
        return throwError(() => error);
      })
    );
  }

  async deleteCurriculum(name: string): Promise<void> {
    try {
      // First, find the curriculum document by name
      const q = query(this.tantervCollection, where("name", "==", name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Curriculum not found');
      }

      const curriculumDoc = snapshot.docs[0];
      const curriculumId = curriculumDoc.id;

      // Get all specializations
      const specializationsSnapshot = await getDocs(
        collection(this.firestore, `Curriculum/${curriculumId}/specializations`)
      );

      for (const specDoc of specializationsSnapshot.docs) {
        // Get all categories for each specialization
        const categoriesSnapshot = await getDocs(
          collection(this.firestore, `Curriculum/${curriculumId}/specializations/${specDoc.id}/categories`)
        );

        // Delete all categories
        for (const catDoc of categoriesSnapshot.docs) {
          await deleteDoc(catDoc.ref);
        }

        // Delete the specialization
        await deleteDoc(specDoc.ref);
      }

      // Finally delete the curriculum
      await deleteDoc(curriculumDoc.ref);
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      throw error;
    }
  }

  async deleteSpec(curriculumName: string, sp: Specialization): Promise<void> {
    try {
      // Find curriculum by name
      const q = query(this.tantervCollection, where("name", "==", curriculumName));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Curriculum not found');
      }

      const curriculumId = snapshot.docs[0].id;

      // Find specialization by name
      const specQuery = query(
        collection(this.firestore, `Curriculum/${curriculumId}/specializations`),
        where("name", "==", sp.name)
      );
      const specSnapshot = await getDocs(specQuery);

      if (specSnapshot.empty) {
        throw new Error('Specialization not found');
      }

      const specDoc = specSnapshot.docs[0];
      
      // Delete all categories
      const categoriesSnapshot = await getDocs(
        collection(this.firestore, `Curriculum/${curriculumId}/specializations/${specDoc.id}/categories`)
      );

      for (const catDoc of categoriesSnapshot.docs) {
        await deleteDoc(catDoc.ref);
      }

      // Delete the specialization
      await deleteDoc(specDoc.ref);
    } catch (error) {
      console.error('Error deleting specialization:', error);
      throw error;
    }
  }

  async deleteCat(curriculumName: string, spName: string, cat: Category): Promise<void> {
    try {
      // Find curriculum by name
      const q = query(this.tantervCollection, where("name", "==", curriculumName));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Curriculum not found');
      }

      const curriculumId = snapshot.docs[0].id;

      // Find specialization by name
      const specQuery = query(
        collection(this.firestore, `Curriculum/${curriculumId}/specializations`),
        where("name", "==", spName)
      );
      const specSnapshot = await getDocs(specQuery);

      if (specSnapshot.empty) {
        throw new Error('Specialization not found');
      }

      const specId = specSnapshot.docs[0].id;

      // Find and delete category
      const catQuery = query(
        collection(this.firestore, `Curriculum/${curriculumId}/specializations/${specId}/categories`),
        where("name", "==", cat.name)
      );
      const catSnapshot = await getDocs(catQuery);

      if (!catSnapshot.empty) {
        await deleteDoc(catSnapshot.docs[0].ref);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}