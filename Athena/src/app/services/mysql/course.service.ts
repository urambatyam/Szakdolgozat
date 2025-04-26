import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Course } from '../../models/course';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../models/paginationResponse';
/**
 * @Injectable CourseService
 * @description
 * Szolgáltatás a kurzusokkal kapcsolatos műveletek kezelésére a backend API-n keresztül.
 * Lehetővé teszi kurzusok létrehozását, lekérdezését, frissítését és törlését.
 */
@Injectable({
  providedIn: 'root'
})
export class CourseService {
      private http = inject(HttpClient);
      private auth = inject(AuthService);
      /**
         * Új kurzust hoz létre a backend rendszerben.
         * @param course Course - A létrehozandó kurzus adatai.
         * @returns Observable, amely a létrehozott kurzus adatait tartalmazza a backend válasza alapján.
       */
      createCourse(course: Course): Observable<Course>{
        return this.http.post<Course>(
          environment.baseUrl+'/courses',
          course,
          {headers: this.auth.getHeaders()}
        );
      }
      /**
        * Lekérdezi az összes elérhető kurzust.
        * @returns Observable, amely egy Course objektumokból álló tömböt tartalmaz.
      */
      getAllCoursesNames(): Observable<Course[]>{
        return this.http.get<Course[]>(
          `${environment.baseUrl}/courses-names`,
          {
            headers: this.auth.getHeaders(),
          }
        );
      }
    /**
     * Lekérdezi egy adott felhasználóhoz tartozó összes kurzust, lapozási és szűrési paraméterekkel.
     * @param userCode string - A felhasználó azonositója.
     * @param page number - Az oldal száma.
     * @param perPage number - Hány rekord ven egy oldalon.
     * @param sortField string - Az oszlop neve amit rendezünk.
     * @param sortDirection 'asc' | 'desc' - A rendezés iránya.
     * @param filter string - A szöveg amivel szürünk az adatokkal.
     * @returns Observable, amely a lapozott választ tartalmazza.
     */
      getAllCoursesOFUser(
        userCode: string,
        page: number = 1,
        perPage: number = 10,
        sortField: string = 'name',
        sortDirection: 'asc' | 'desc' = 'asc',
        filter?: string
      ): Observable<PaginatedResponse<Course>> {
        const params = new HttpParams()
          .set('page', page.toString())
          .set('per_page', perPage.toString())
          .set('sort_field', sortField)
          .set('sort_direction', sortDirection)
          .set('filter', filter || '');
    
        return this.http.get<PaginatedResponse<Course>>(
          `${environment.baseUrl}/courses/user/${userCode}`,
          {
            headers: this.auth.getHeaders(),
            params
          }
        );
      }
      /**
         * Frissít egy meglévő kurzust a backend rendszerben.
         * @param course Course- A frissítendő kurzus adatai.
         * @returns Observable, amely a frissített kurzus adatait tartalmazza a backend válasza alapján.
       */
      updateCourse(course: Course): Observable<Course>{
        return this.http.put<Course>(
          environment.baseUrl+'/courses/'+course.id,
          course,
          {headers: this.auth.getHeaders()}
        );
      }
      /**
      * Töröl egy kurzust az azonosítója alapján a backend rendszerből.
      * @param course_id number - A törlendő kurzus egyedi azonosítója.
      * @returns Observable, amely a törlési művelet eredményét tartalmazza.
      */
      deleteCourse(course_id:number): Observable<Course>{
        return this.http.delete<any>(
          environment.baseUrl+'/courses/'+course_id,
          {headers: this.auth.getHeaders()});
      }
}
