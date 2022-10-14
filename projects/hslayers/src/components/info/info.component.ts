import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from './../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {getTitle} from '../../common/layer-extensions';
/**
 * HsInfoComponent
 */
@Component({
  selector: 'hs-info',
  templateUrl: './partials/info.component.html',
})
export class HsInfoComponent extends HsPanelBaseComponent implements OnDestroy {
  /**
   * Store if composition is loaded
   */
  composition_loaded = true;
  /**
   * List of layers which are currently loading.
   */
  layer_loading = [];
  composition_abstract: string;
  composition_title: string;
  composition_id: number;
  info_image: string;
  composition_edited: boolean;
  private end = new Subject<void>();
  constructor(
    private hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    private hsConfig: HsConfig
  ) {
    super(hsLayoutService);
    this.hsEventBusService.compositionLoading
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        if (data.error === undefined) {
          if (data.data !== undefined) {
            this.composition_abstract = data.data.abstract;
            this.composition_title = data.data.title;
            this.composition_id = data.data.id;
          } else {
            this.composition_abstract = data.abstract;
            this.composition_title = data.title;
            this.composition_id = data.id;
          }
          this.composition_loaded = false;
          //Composition image (should be glyphicon?)
          this.info_image = 'icon-map';
        }
      });

    this.hsEventBusService.compositionLoads
      .pipe(takeUntil(this.end))
      .subscribe(({data}) => {
        if (data.error !== undefined) {
          const temp_abstract = this.composition_abstract;
          const temp_title = this.composition_title;
          this.composition_abstract = data.abstract;
          this.composition_title = data.title;
          this.composition_title = temp_title;
          this.composition_abstract = temp_abstract;
        }
        this.composition_loaded = true;
        this.composition_edited = false;
      });

    this.hsEventBusService.layerLoadings
      .pipe(takeUntil(this.end))
      .subscribe(({layer, progress, app}) => {
        if (app == this.data.app) {
          if (!this.layer_loading.includes(getTitle(layer))) {
            this.layer_loading.push(getTitle(layer));
            this.composition_loaded = false;
          }
        }
      });

    this.hsEventBusService.layerLoads
      .pipe(takeUntil(this.end))
      .subscribe(({layer, app}) => {
        if (app == this.data.app) {
          for (let i = 0; i < this.layer_loading.length; i++) {
            if (this.layer_loading[i] == getTitle(layer)) {
              this.layer_loading.splice(i, 1);
            }
          }

          if (this.layer_loading.length == 0 && !this.composition_loaded) {
            this.composition_loaded = true;
          }
        }
      });

    this.hsEventBusService.compositionDeletes
      .pipe(takeUntil(this.end))
      .subscribe(({composition, app}) => {
        if (app == this.data.app) {
          if (composition.id == this.composition_id) {
            delete this.composition_title;
            delete this.composition_abstract;
          }
        }
      });

    this.hsEventBusService.mapResets
      .pipe(takeUntil(this.end))
      .subscribe(({app}) => {
        if (app == this.data.app) {
          delete this.composition_title;
          delete this.composition_abstract;
          this.layer_loading.length = 0;
          this.composition_loaded = true;
          this.composition_edited = false;
        }
      });

    this.hsEventBusService.compositionEdits
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.composition_edited = true;
      });
    this.hsConfig.configChanges
      .pipe(takeUntil(this.end))
      .subscribe(({app, config}) => {
        if (this.data.app == app) {
          this.isVisible$.next(this.isVisible());
        }
      });
  }
  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  trackByFn(index: number): number {
    return index; // or item.id
  }
  /**

   * @returns Returns true if composition title available
   * est if composition is loaded, to change info template.
   */
  compositionLoaded(): boolean {
    return this.composition_title !== undefined;
  }

  isVisible(): boolean {
    return this.hsLayoutService.panelEnabled(
      'compositionLoadingProgress',
      this.data.app
    );
  }
}
