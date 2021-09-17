import {ViewRef} from '@angular/core';

export interface HsPanelComponent {
  viewRef: ViewRef;
  data: any;
  name: string;
  isVisible(): boolean;
}
