import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Optimalization } from '../../models/optimalization';



@Injectable({
  providedIn: 'root'
})
export class OptimalizationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  optimizeCurriculum(param:Optimalization): Observable<any>{
    if(param.algorithm === 'bnb'){
      return this.optimalizeByBnB(param);
    }else{
      return this.optimalizeByGreedy(param);
    }
  }
  optimalizeByBnB(param:Optimalization): Observable<any>{
    return this.http.post<any>(
      environment.baseUrl+'/optimalizeByBnB',
      param,
      {headers: this.auth.getHeaders()}
    );
  }
  optimalizeByGreedy(param:Optimalization): Observable<any>{
    return this.http.post<any>(
      environment.baseUrl+'/optimalizeByGreedy',
      param,
      {headers: this.auth.getHeaders()}
    );
  }
}
