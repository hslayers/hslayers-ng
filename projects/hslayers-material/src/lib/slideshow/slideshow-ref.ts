import {OverlayRef} from '@angular/cdk/overlay';

import {HsMatSlideshowComponent} from './slideshow.component';

export class HsMatSlideshowRef {
  componentInstance: HsMatSlideshowComponent;

  constructor(private overlayRef: OverlayRef) {}

  close(): void {
    this.overlayRef.dispose();
  }
}
