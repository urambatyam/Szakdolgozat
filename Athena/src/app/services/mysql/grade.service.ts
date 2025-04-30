import { HttpClient, HttpParams } from '@angular/common/http'; 
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Grade, GradeApiResponse } from '../../models/grade';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs'; 

/**
 * @Injectable GradeService
 * @description
 * Szolgáltatás a jegyekkel kapcsolatos műveletek kezelésére a backend API-n keresztül.
 * Lehetővé teszi jegyek létrehozását, lekérdezését, frissítését és törlését.
 */
@Injectable({
  providedIn: 'root'
})
export class GradeService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);

    /**
     * Új jegyet hoz létre egy adott kurzushoz a bejelentkezett felhasználó számára.
     * Ez a metódus tipikusan a kurzusra való jelentkezéskor hívódik meg.
     * @param course_id - Annak a kurzusnak az azonosítója, amelyre a felhasználó jelentkezik.
     * @returns Observable, amely a backend válaszát tartalmazza.
     */
    createGrade(course_id : number): Observable<any>{ 
      return this.http.post<any>(
        environment.baseUrl+'/grade',
        {course_id: course_id},
        {headers: this.auth.getHeaders()}
      );
    }

    /**
     * Lekérdezi az összes jegyet a rendszerből.
     * @returns Observable, amely egy Grade objektumokból álló tömböt tartalmaz.
     */
    getAllGrades(): Observable<Grade[]>{
      return this.http.get<Grade[]>(
        environment.baseUrl+'/grade',
        {headers: this.auth.getHeaders()}
      );
    }

    /**
     * Lekérdezi egy adott kurzushoz tartozó összes jegyet, lapozási és szűrési paraméterekkel.
     * @param courseId - A kurzus azonosítója.
     * @param params - HTTP paraméterek (pl. lapozás, rendezés, szűrés).
     * @returns Observable, amely a lapozott választ tartalmazza.
     */
    getAllGradesInCourse(courseId: number, params: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<GradeApiResponse> {
      return this.http.get<GradeApiResponse>(
        environment.baseUrl+`/grade/course/${courseId}`,
        {headers: this.auth.getHeaders(), params}
      );
    }

    /**
     * Lekérdezi egy adott hallgatóhoz tartozó összes jegyet, lapozási és szűrési paraméterekkel.
     * @param studentCode - A hallgató Athéna kódja.
     * @param params - HTTP paraméterek (pl. lapozás, rendezés, szűrés).
     * @returns Observable, amely a lapozott választ tartalmazza.
     */
    getAllGradesOFStudent(studentCode:string, params: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<GradeApiResponse>{
      return this.http.get<GradeApiResponse>(
        environment.baseUrl+'/grade/student/'+studentCode,
        {headers: this.auth.getHeaders(), params}
      );
    }

    /**
     * Frissít egy meglévő jegyet.
     * @param grade - A frissítendő Grade objektum, amely tartalmazza a jegy azonosítóját és a frissített adatokat.
     * @returns Observable, amely a frissített Grade objektumot tartalmazza a backend válasza alapján.
     */
    updateGrade(grade: Grade): Observable<Grade>{
      return this.http.put<Grade>(
        environment.baseUrl+'/grade/'+grade.id,
        grade,
        {headers: this.auth.getHeaders()}
      );
    }

    /**
     * Töröl egy jegyet az azonosítója alapján.
     * @param gradeId - A törlendő jegy egyedi azonosítója.
     * @returns Observable, amely a törlési művelet eredményét tartalmazza.
     */
    deleteGrade(gradeId:number): Observable<any>{ 
      return this.http.delete<any>(
        environment.baseUrl+'/grade/'+gradeId,
        {headers: this.auth.getHeaders()});
    }
}
