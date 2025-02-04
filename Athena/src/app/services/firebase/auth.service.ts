import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User, updateCurrentUser, updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider, deleteUser  } from '@angular/fire/auth';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  auth = inject(Auth);
  
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return this.auth.signOut();
  }
  
  isLoggedIn(): Observable<User | null> {
    return new Observable((subscriber) => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(user);
      });
    });
  }

  changePassword(oldPassword:string, newPassword:string){
    const currentUser = this.auth.currentUser;
    if(currentUser && currentUser.email){
      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
      reauthenticateWithCredential(currentUser, credential).then(() => {
        updatePassword( currentUser, newPassword).then(() => {
          alert("A jelszót sikeresen megváltoztatuk!");
        }).catch((error) => {
          alert("A jelszót nem sikerült megváltoztatni! Hiba történt: "+ error);
        });
      }).catch((error) => {
        alert("Nem sikerült autentikálni a felhasználót! Hiba történt: "+ error);
      });
    }
  }

  changeEmail(oldEmail:string, newEamil:string, password:string){
    const currentUser = this.auth.currentUser;

    if(currentUser ){
      const credential = EmailAuthProvider.credential(oldEmail, password);
      reauthenticateWithCredential(currentUser, credential).then(() => {
        updateEmail( currentUser, newEamil).then(() => {
          alert("Az emailt sikeresen megváltoztatuk!");
        }).catch((error) => {
          alert("Az emailt nem sikerült megváltoztatni! Hiba történt: "+ error);
        });
      }).catch((error) => {
        alert("Nem sikerült autentikálni a felhasználót! Hiba történt: "+ error);
      });
    }
  }

  deleteUser(password:string){
    const currentUser = this.auth.currentUser;

    if(currentUser && currentUser.email){
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      reauthenticateWithCredential(currentUser, credential).then(() => {
        deleteUser( currentUser).then(() => {
          alert("Az emailt sikeresen megváltoztatuk!");
        }).catch((error) => {
          alert("Az emailt nem sikerült megváltoztatni! Hiba történt: "+ error);
        });
      }).catch((error) => {
        alert("Nem sikerült autentikálni a felhasználót! Hiba történt: "+ error);
      });
    }
  }
}