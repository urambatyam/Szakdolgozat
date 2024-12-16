import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatToolbarModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  router = inject(Router)
  ngOnInit(): void {
    this.auth.isLoggedIn().subscribe((user) => {
      if (user) {
        //console.log('Felhasználó UID:', user.uid);
        //console.log('Felhasználó email:', user.email);
        //console.log('Profilkép URL:', user.photoURL);
        //console.log('Email ellenőrizve:', user.emailVerified);
      } else {
        console.log('Nincs bejelentkezve.');
      }
    });
  }
  auth = inject(AuthService);

  logOut(){
    console.log("Sikeres kijelenkezés");
    this.auth.logout();
    this.router.navigateByUrl('login');
  } 
}
