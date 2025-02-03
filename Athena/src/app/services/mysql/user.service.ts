import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);


  update(updateUser: Partial<User>): Observable<User>{
    return this.http.put<User>(
      environment.baseUrl+'/user',
      updateUser,
      {headers: this.auth.getHeaders()}
    );
  }

  updatePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Observable<any> {
    return this.http.put<any>(
      environment.baseUrl+'/user/password',
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation
      },
      { headers: this.auth.getHeaders() }
    );
  }

  delete(code:string): Observable<any>{
    return this.http.delete<any>(
      environment.baseUrl+'/user/'+code,
      {headers: this.auth.getHeaders()})
  }

  getUser(code:string): Observable<User>{
    return this.http.get<User>(
      environment.baseUrl+'/user/'+code,
       {headers: this.auth.getHeaders()}
    );
  }

  getAllUsers(): Observable<User[]>{
    return this.http.get<User[]>(
      environment.baseUrl+'/user',
      {headers: this.auth.getHeaders()}
    );
  }
}
