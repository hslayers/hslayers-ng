import {Observable} from 'rxjs';
import {ViewRef} from '@angular/core';

export interface HsPanelComponent {
  unpinned?: boolean;
  viewRef: ViewRef;
  data: any;
  name: string;
  isVisible$: Observable<boolean>;
  /**
   * Optional function so panel can clean up
   * after itself (delete data, related components etc.)
   * when destroyed manually by HsPanelContainerService.destroy
   */
  cleanup?(): void;
}
