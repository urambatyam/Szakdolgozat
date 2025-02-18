import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Course } from '../../models/course';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../models/paginationResponse';
@Injectable({
  providedIn: 'root'
})
export class CourseService {

  
      private http = inject(HttpClient);
      private auth = inject(AuthService);
  
      createCourse(course: Course): Observable<Course>{
        return this.http.post<Course>(
          environment.baseUrl+'/courses',
          course,
          {headers: this.auth.getHeaders()}
        );
      }

      getAllCoursesNames(): Observable<Course[]>{
        return this.http.get<Course[]>(
          `${environment.baseUrl}/courses-names`,
          {
            headers: this.auth.getHeaders(),
          }
        );
      }

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

      updateCourse(course: Course): Observable<Course>{
        return this.http.put<Course>(
          environment.baseUrl+'/courses/'+course.id,
          course,
          {headers: this.auth.getHeaders()}
        );
      }
      deleteCourse(course_id:number): Observable<Course>{
        return this.http.delete<any>(
          environment.baseUrl+'/courses/'+course_id,
          {headers: this.auth.getHeaders()});
      }
}
