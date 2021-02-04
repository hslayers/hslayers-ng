import {Component} from '@angular/core';
import {HsToastService} from './toast.service';

@Component({
  selector: 'hs-toast',
  templateUrl: './toast.html',
  styles: [
    `
      :host {
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 9999;
        border-style: none;
      }
    `,
  ],
})
export class HsToastComponent {
  constructor(public PmToastService: HsToastService) {}
}