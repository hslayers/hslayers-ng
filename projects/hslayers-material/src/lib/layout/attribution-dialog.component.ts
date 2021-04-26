import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'hs-mat-attributions',
  template: `
    <h1 mat-dialog-title>Attributions</h1>
    <div mat-dialog-content class="mat-typography">
      <ul>
        <li *ngFor="let item of data" [innerHTML]="item"></li>
      </ul>
    </div>
  `,
  styleUrls: ['attribution-dialog.scss'],
})
export class HsAttributionDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string[]) {}
}
