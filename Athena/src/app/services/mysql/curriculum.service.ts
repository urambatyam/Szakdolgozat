import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Curriculum } from '../../models/curriculum';

@Injectable({
  providedIn: 'root'
})
export class CurriculumService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);
    
        createCurriculum(curriculum: Curriculum): Observable<Curriculum>{
          return this.http.post<Curriculum>(
            environment.baseUrl+'/curricula',
            curriculum,
            {headers: this.auth.getHeaders()}
          );
        }
        getAllCurriculums(): Observable<Curriculum[]>{
          return this.http.get<Curriculum[]>(
            environment.baseUrl+'/curricula',
            {headers: this.auth.getHeaders()}
          );
        }
  
        updateCurriculum(curriculum: Curriculum): Observable<Curriculum>{
          return this.http.put<Curriculum>(
            environment.baseUrl+'/curricula',
            curriculum,
            {headers: this.auth.getHeaders()}
          );
        }
        deleteCurriculum(curriculumId:number): Observable<Curriculum>{
          return this.http.delete<any>(
            environment.baseUrl+'/curricula/'+curriculumId,
            {headers: this.auth.getHeaders()});
        }
}
