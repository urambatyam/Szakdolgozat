import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { SubjectMatter } from '../../models/subjectMatter';
/**
 * @Injectable SubjectMatterService
 * @description
 * Szolgáltatás a tárgytematikával kapcsolatos műveletek kezelésére a backend API-n keresztül.
 * Lehetővé teszi a térgytematika lekérdezését, és frissítését.
 */
@Injectable({
  providedIn: 'root'
})
export class SubjectMatterService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
    /**
    * Lekérdez egy adott tárgytematika az azonosítója alapján.
    * @param courseId number - A lekérdezendő tárgytematika egyedi azonosítója.
    * @returns Observable, amely a kért tárgytematika adatait tartalmazza.
    */
    getSebjectMatter(courseId: number): Observable<SubjectMatter>{
      return this.http.get<SubjectMatter>(
        environment.baseUrl+'/subjectMatter/'+courseId,
        {headers: this.auth.getHeaders()}
      );
    }
    /**
    * Frissít egy meglévő tárgytematikát a backend rendszerben.
    * @param subjectMatter SubjectMatter- A frissítendő tárgytematikát adatai.
    * @returns Observable, amely a frissített tárgytematika adatait tartalmazza a backend válasza alapján.
    */
    updateSebjectMatter(subjectMatter:SubjectMatter): Observable<SubjectMatter>{
      return this.http.put<SubjectMatter>(
        environment.baseUrl+'/subjectMatter',
        subjectMatter,
        {headers: this.auth.getHeaders()}
      );
    }
}
