import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../services/mysql/auth.service';
import { firstValueFrom, from, map} from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatToolbarModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  private router = inject(Router)
  private auth = inject(AuthService);
  protected role: 'student'|'teacher'|'admin'|null = null; 
  async ngOnInit() {
    await firstValueFrom(
      from(this.auth.user$)
        .pipe(
          map(
            user => {
              this.role = user?.role ?? null;
            }
          )
        )
      );
  }
  

  async logOut(){
    console.log("Sikeres kijelenkezés");
    await firstValueFrom(
      from(this.auth.logout())
    )
    this.router.navigateByUrl('login');
  } 
}
function form(user$: unknown) {
  throw new Error('Function not implemented.');
}

