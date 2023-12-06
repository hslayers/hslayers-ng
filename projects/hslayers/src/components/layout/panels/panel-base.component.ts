import {Component, OnInit, ViewRef} from '@angular/core';
import {Observable, map} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsLayoutService} from '../layout.service';
import {HsPanelComponent} from './panel-component.interface';

@Component({
  template: '<div></div>',
  standalone: true,
})
export class HsPanelBaseComponent implements HsPanelComponent, OnInit {
  name: string;
  viewRef: ViewRef;
  data: any;
  isVisible$ = new Observable<boolean>();

  panelWidthClass: string;

  /**
   * Control to make sure HsPanelBaseComponent ngOnInit was run eg.
   * was called from parent ngOnInit or when parents ngOnInit is not defined
   */
  private baseComponentInitRun = false;

  constructor(public hsLayoutService: HsLayoutService) {
    this.isVisible$ = this.hsLayoutService.mainpanel$.pipe(
      map((which) => {
        return this.name === which;
      }),
    );

    setTimeout(() => {
      if (!this.baseComponentInitRun) {
        console.warn(
          `${
            this.name || this.constructor.name
          } implements ngOnInit lifecycle hook without calling HsPanelBaseComponent ngOnInit. 
          Make sure it is executed by calling super.ngOnInit() from components ngOnInit manually`,
        );
      }
    }, 3000);
  }

  ngOnInit() {
    this.baseComponentInitRun = true;
    this.panelWidthClass = this.getPanelWidthClass();
    this.hsLayoutService.hsConfig.configChanges
      //.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.panelWidthClass = this.getPanelWidthClass();
      });
  }

  /**
   * Set panelWidthClass
   */
  private getPanelWidthClass() {
    const pnlWidth =
      this.hsLayoutService.hsConfig.panelWidths[this.name] ||
      this.hsLayoutService.hsConfig.panelWidths['default'];

    return `hs-panel-width-${Math.round(pnlWidth / 25) * 25}`;
  }
}
