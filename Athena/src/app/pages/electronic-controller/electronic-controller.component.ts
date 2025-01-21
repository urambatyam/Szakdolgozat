import { Component, inject, OnInit } from '@angular/core';
import { TantervService } from '../../services/tanterv.service';

@Component({
  selector: 'app-electronic-controller',
  standalone: true,
  imports: [],
  templateUrl: './electronic-controller.component.html',
  styleUrl: './electronic-controller.component.scss'
})
export class ElectronicControllerComponent implements OnInit {
  teszt = inject(TantervService);
ngOnInit(): void {
  this.valasz = 'gedgdeg'

}
valasz: any;


}
