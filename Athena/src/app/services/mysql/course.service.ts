import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Course } from '../../models/course';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  
      private http = inject(HttpClient);
      private auth = inject(AuthService);
  
      createCourse(course: Course): Observable<Course>{
        return this.http.post<Course>(
          environment.baseUrl+'/course',
          course,
          {headers: this.auth.getHeaders()}
        );
      }
      getAllCourses(): Observable<Course[]>{
        return this.http.get<Course[]>(
          environment.baseUrl+'/course',
          {headers: this.auth.getHeaders()}
        );
      }

      getAllCoursesOFUser(userCode:string): Observable<Course[]>{
        return this.http.get<Course[]>(
          environment.baseUrl+'/course/user'+userCode,
          {headers: this.auth.getHeaders()}
        );
      }
      updateCourse(course: Course): Observable<Course>{
        return this.http.put<Course>(
          environment.baseUrl+'/course',
          course,
          {headers: this.auth.getHeaders()}
        );
      }
      deleteCourse(courseId:number): Observable<Course>{
        return this.http.delete<any>(
          environment.baseUrl+'/course/'+courseId,
          {headers: this.auth.getHeaders()});
      }
}
