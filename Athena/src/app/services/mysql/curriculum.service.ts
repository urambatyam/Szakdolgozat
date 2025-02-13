import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

        getAllCurriculumNames(): Observable<Curriculum[]>{
          return this.http.get<Curriculum[]>(
            '/api/curricula',
            {headers: this.auth.getHeaders()}
          );
        }
  
        getCurriculum(id:number): Observable<Curriculum>{
          return this.http.get<Curriculum>(
            environment.baseUrl+'/curricula/'+id,
            {headers: this.auth.getHeaders()}
          );
        }

        updateCurriculum(curriculum: Curriculum): Observable<Curriculum>{
          return this.http.put<Curriculum>(
            environment.baseUrl+'/curricula/'+curriculum.id,
            curriculum,
            {headers: this.auth.getHeaders()}
          );
        }
        deleteCurriculum(curriculumId:number): Observable<Curriculum>{
          return this.http.delete<Curriculum>(
            environment.baseUrl+'/curricula/'+curriculumId,
            {headers: this.auth.getHeaders()});
        }
}
