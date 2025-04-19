import { Component } from '@angular/core';
import { MenuComponent } from "./menu/menu.component";
/**
 * A webapp fő komponenese Ez foglja magába a menüt és a helyet (`<router-outlet>`),
 * ahová az egyes oldalak betöltődnek a navigáció során.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ 
    MenuComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent{}
