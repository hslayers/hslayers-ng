import {Component} from '@angular/core';
import {HsToastService} from './toast.service';

@Component({
  selector: 'hs-toast',
  templateUrl: './toast.html',
  styles: [
    `
      :host {
        position: absolute;
        bottom: 0.1rem;
        z-index: 150;
        border-style: none;
        display: flex;
        max-height: 90%;
        flex-direction: column;
        max-width: 400px;
      }
    `,
  ],
})
export class HsToastComponent {
  constructor(public PmToastService: HsToastService) {}
}
