import {Component, DestroyRef, OnInit, ViewRef, inject} from '@angular/core';
import {Observable, of} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsPanelComponent} from './panel-component.interface';

@Component({
  template: '<div></div>',
  standalone: true,
})
export class HsGuiOverlayBaseComponent implements HsPanelComponent, OnInit {
  name: string;
  viewRef: ViewRef;
  data: any;
  isVisible$ = new Observable<boolean>();

  /**
   * Control to make sure HsGuiOverlayBaseComponent ngOnInit was run eg.
   * was called from parent ngOnInit or when parents ngOnInit is not defined
   */
  private baseComponentInitRun = false;
  hsLayoutService = inject(HsLayoutService);
  destroyRef = inject(DestroyRef);

  constructor() {
    setTimeout(() => {
      if (!this.baseComponentInitRun) {
        console.warn(
          `${
            this.name || this.constructor.name
          } implements ngOnInit lifecycle hook without calling HsGuiOverlayBaseComponent ngOnInit. 
          Make sure it is executed by calling super.ngOnInit() from component's ngOnInit manually`,
        );
      }
    }, 3000);
  }

  ngOnInit(): void {
    this.baseComponentInitRun = true;
    this.isVisible$ = this.componentEnabled();
    this.hsLayoutService.hsConfig.configChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isVisible$ = this.componentEnabled();
      });

    if (!this.name) {
      console.error(`${this.constructor.name} is missing a name property!`);
    }
  }

  /**
   * Determine component visiblity
   */
  componentEnabled(): Observable<boolean> {
    return of(
      this.hsLayoutService.componentEnabled(this.name) &&
        this.hsLayoutService.componentEnabled('guiOverlay'),
    );
  }
}
