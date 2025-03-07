import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { SubjectMatter } from '../../models/subjectMatter';

@Injectable({
  providedIn: 'root'
})
export class SubjectMatterService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);
      
    getSebjectMatter(courseId: number): Observable<SubjectMatter>{
      return this.http.get<SubjectMatter>(
        environment.baseUrl+'/subjectMatter/'+courseId,
        {headers: this.auth.getHeaders()}
      );
    }
  
    updateSebjectMatter(subjectMatter:SubjectMatter): Observable<SubjectMatter>{
      return this.http.put<SubjectMatter>(
        environment.baseUrl+'/subjectMatter',
        subjectMatter,
        {headers: this.auth.getHeaders()}
      );
    }
}
