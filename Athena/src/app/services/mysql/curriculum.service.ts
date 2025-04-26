import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Observable} from 'rxjs';
import { Curriculum } from '../../models/curriculum';
import { Name } from '../../models/curriculumNames';

/**
 * @Injectable CurriculumService
 * @description
 * Szolgáltatás a tantervekkel kapcsolatos műveletek kezelésére a backend API-n keresztül.
 * Lehetővé teszi tantervek létrehozását, lekérdezését, frissítését és törlését.
 */
@Injectable({
  providedIn: 'root'
})
export class CurriculumService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

        /**
         * Új tantervet hoz létre a backend rendszerben.
         * @param curriculum - A létrehozandó tanterv adatai.
         * @returns Observable, amely a létrehozott tanterv adatait tartalmazza a backend válasza alapján.
         */
        createCurriculum(curriculum: Curriculum): Observable<Curriculum>{
          return this.http.post<Curriculum>(
            environment.baseUrl+'/curricula',
            curriculum,
            {headers: this.auth.getHeaders()}
          );
        }

        /**
         * Lekérdezi az összes elérhető tanterv nevét és azonosítóját.
         * @returns Observable, amely egy Name objektumokból álló tömböt tartalmaz.
         */
        getAllCurriculumNames(): Observable<Name[]>{
          return this.http.get<Name[]>(
            environment.baseUrl+'/curricula',
            {headers: this.auth.getHeaders()}
          );
        }

        /**
         * Lekérdez egy adott tantervet az azonosítója alapján.
         * Opcionálisan szűrhet egy kurzus ID-ra, hogy csak az adott kurzust tartalmazó tanterv-részletet kapja vissza.
         * @param id - A lekérdezendő tanterv egyedi azonosítója.
         * @param courseIdFilter - Opcionális kurzus ID. Ha meg van adva, a backend csak az ehhez a kurzushoz tartozó adatokat adja vissza a tanterven belül.
         * @returns Observable, amely a kért tanterv adatait tartalmazza.
         */
        getCurriculum(id: number, courseIdFilter?: number | null): Observable<Curriculum>{
          let params = new HttpParams();
          if (courseIdFilter !== null && courseIdFilter !== undefined) {
            params = params.set('course_id_filter', courseIdFilter.toString());
          }
          return this.http.get<Curriculum>(
            environment.baseUrl+'/curricula/'+id,
            {headers: this.auth.getHeaders(), params: params} 
          );
        }

        /**
         * Frissít egy meglévő tantervet a backend rendszerben.
         * @param curriculum - A frissítendő tanterv adatai, beleértve az azonosítóját.
         * @returns Observable, amely a frissített tanterv adatait tartalmazza a backend válasza alapján.
         */
        updateCurriculum(curriculum: Curriculum): Observable<Curriculum>{
          return this.http.put<Curriculum>(
            environment.baseUrl+'/curricula/'+curriculum.id,
            curriculum,
            {headers: this.auth.getHeaders()}
          );
        }

        /**
         * Töröl egy tantervet az azonosítója alapján a backend rendszerből.
         * @param curriculumId - A törlendő tanterv egyedi azonosítója.
         * @returns Observable, amely a törlési művelet eredményét tartalmazza.
         */
        deleteCurriculum(curriculumId:number): Observable<Curriculum>{ 
          return this.http.delete<Curriculum>(
            environment.baseUrl+'/curricula/'+curriculumId,
            {headers: this.auth.getHeaders()});
        }
}
