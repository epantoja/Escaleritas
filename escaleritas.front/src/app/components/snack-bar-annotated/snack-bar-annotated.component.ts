import { Component, inject, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarModel } from '../models/snackBar.model';

@Component({
  selector: 'app-snack-bar-annotated',
  templateUrl: './snack-bar-annotated.component.html',
  styleUrls: ['./snack-bar-annotated.component.css']
})
export class SnackBarAnnotatedComponent {

  snackBarRef = inject(MatSnackBarRef);
  mensajes: String[] = [];

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackBarModel
  ) {
    if (!Array.isArray(data.mensajes)) {
      this.mensajes.push(data.mensajes);
    } else {
      this.mensajes = data.mensajes;
    }
  }

}
