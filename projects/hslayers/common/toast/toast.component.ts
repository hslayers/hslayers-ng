import {Component} from '@angular/core';

import {HsToastService} from './toast.service';

@Component({
  selector: 'hs-toast',
  templateUrl: './toast.component.html',
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
        padding: 1rem 0;
        gap: 0.5rem;
      }

      :host-context(.hs-mobile-view) {
        top: 0;
        right: 50%;
        transform: translateX(50%);
      }
    `,
  ],
  standalone: false,
})
export class HsToastComponent {
  constructor(public hsToastService: HsToastService) {}
}
