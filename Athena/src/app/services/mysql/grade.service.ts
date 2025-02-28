import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Grade } from '../../models/grade';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '../../models/paginationResponse';
import { Semester } from '../../models/semester';

@Injectable({
  providedIn: 'root'
})
export class GradeService {

    private http = inject(HttpClient);
    private auth = inject(AuthService);

    createGrade(course_id : number): Observable<Grade>{
      return this.http.post<Grade>(
        environment.baseUrl+'/grade',
        {course_id: course_id},
        {headers: this.auth.getHeaders()}
      );
    }
    getAllGrades(): Observable<Grade[]>{
      return this.http.get<Grade[]>(
        environment.baseUrl+'/grade',
        {headers: this.auth.getHeaders()}
      );
    }
    getAllGradesInCourse(courseId: number, params: any) {
      return this.http.get<any>(
        environment.baseUrl+`/grade/course/${courseId}`, 
        {headers: this.auth.getHeaders(),params}
      )
    }

    getAllGradesOFStudent(studentCode:string, params: any){
      return this.http.get<any>(
        environment.baseUrl+'/grade/student/'+studentCode,
        {headers: this.auth.getHeaders(),params}
      );
    }
    
    updateGrade(grade: Grade): Observable<Grade>{
      return this.http.put<Grade>(
        environment.baseUrl+'/grade/'+grade.id,
        grade,
        {headers: this.auth.getHeaders()}
      );
    }
    deleteGrade(gradeId:number): Observable<Grade>{
      return this.http.delete<any>(
        environment.baseUrl+'/grade/'+gradeId,
        {headers: this.auth.getHeaders()});
    }
    statisticAbaoutCourse(course_name:string): Observable<Grade[]>{
      return this.http.get<Grade[]>(
        environment.baseUrl+'/statistic/'+course_name,
        {headers: this.auth.getHeaders()}
      );
    }
    statisticAbaoutAll(): Observable<any[]>{
      return this.http.get<any[]>(
        environment.baseUrl+'/statistic',
        {headers: this.auth.getHeaders()}
      );
    }
}
