import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { CourseForum } from '../../models/courseForum';
/**
 * @Injectable CourseForumService
 * @description
 * Szolgáltatás a kurzus forum bejegyzéssel kapcsolatos műveletek kezelésére a backend API-n keresztül.
 * Lehetővé teszi bejegyzések létrehozását, lekérdezését, és törlését.
 */
@Injectable({
  providedIn: 'root'
})
export class CourseForumService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
      /**
         * Új kurzus forum bejegyzést hoz létre a backend rendszerben.
         * @param courseForum CourseForum - A létrehozandó kurzus forum bejegyzés adatai.
         * @returns Observable, amely a létrehozott bejegyzés adatait tartalmazza a backend válasza alapján.
       */
        createCourseForum(courseForum: CourseForum): Observable<CourseForum>{
          return this.http.post<CourseForum>(
            environment.baseUrl+'/course_forum',
            courseForum,
            {headers: this.auth.getHeaders()}
          );
        }
      /**
      * Lekérdezi egy kurzus forumhoz tartozó összes bejegyzést a kurzus azonosítója alapján a backend rendszerből.
      * @param courseId number - A kurzus egyedi azonosítója.
      * @returns Observable, amely a kurzus forumhoz tartozó összes bejegyzést tartalmaza.
      */
        getAllCourseForumsInCourse(courseId:number): Observable<CourseForum[]>{
          return this.http.get<CourseForum[]>(
            environment.baseUrl+'/course_forum/'+courseId,
            {headers: this.auth.getHeaders()}
          );
        }
      /**
      * Töröl egy kurzus forum bejegyzést az azonosítója alapján a backend rendszerből.
      * Nincs használatban
      * @param courseForumId number - A törlendő bejegyzést egyedi azonosítója.
      * @returns Observable, amely a törlési művelet eredményét tartalmazza.
      */
        deleteCourseForum(courseForumId:number): Observable<CourseForum>{
          return this.http.delete<any>(
            environment.baseUrl+'/course_forum/'+courseForumId,
            {headers: this.auth.getHeaders()});
        }
}
