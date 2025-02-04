import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { CourseForum } from '../../models/courseForum';

@Injectable({
  providedIn: 'root'
})
export class CourseForumService {

        private http = inject(HttpClient);
        private auth = inject(AuthService);
    
        createCourseForum(courseForum: CourseForum): Observable<CourseForum>{
          return this.http.post<CourseForum>(
            environment.baseUrl+'/course_forum',
            courseForum,
            {headers: this.auth.getHeaders()}
          );
        }

  
        getAllCourseForumsInCourse(courseName:string): Observable<CourseForum[]>{
          return this.http.get<CourseForum[]>(
            environment.baseUrl+'/course_forum/'+courseName,
            {headers: this.auth.getHeaders()}
          );
        }
        /*updateCourseForum(courseForum: CourseForum): Observable<CourseForum>{
          return this.http.put<CourseForum>(
            environment.baseUrl+'/course_forum',
            courseForum,
            {headers: this.auth.getHeaders()}
          );
        }*/
        deleteCourseForum(courseForumId:number): Observable<CourseForum>{
          return this.http.delete<any>(
            environment.baseUrl+'/course_forum/'+courseForumId,
            {headers: this.auth.getHeaders()});
        }
}
