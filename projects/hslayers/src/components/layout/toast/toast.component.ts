import {Component, Input, OnInit} from '@angular/core';
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
export class HsToastComponent implements OnInit {
  @Input() app = 'default';
  appRef;
  constructor(public PmToastService: HsToastService) {}

  ngOnInit(): void {
    this.appRef = this.PmToastService.get(this.app);
  }
}
