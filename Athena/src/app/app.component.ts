import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MenuComponent } from "./menu/menu.component";
import { AuthService } from './services/auth.service';
import { User } from './models/user';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  auth = inject(AuthService);
  ngOnInit(): void {
    localStorage.setItem('user','');
    this.auth.isLoggedIn().subscribe( 
      user => {
        if(user != null){
          localStorage.setItem('user', JSON.stringify(user))
        }else{
          localStorage.setItem('user', '')
        }
        console.log('localStorage: ')
        var logged:User = JSON.parse(localStorage.getItem('user') as string);
        console.log(logged)
      }
    )
  }
  title = 'Athena';
}
