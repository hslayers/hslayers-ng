import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsEventBusService} from './../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsUtilsService} from './../utils/utils.service';
import {getTitle} from '../../common/layer-extensions';
/**
 * HsInfoComponent
 */
@Component({
  selector: 'hs-info',
  templateUrl: './partials/info.html',
})
export class HsInfoComponent extends HsPanelBaseComponent implements OnDestroy {
  /**
   * @type {boolean} true
   * Store if composition is loaded
   */
  composition_loaded = true;
  /**
   * @type {Array} null
   * @description List of layers which are currently loading.
   */
  layer_loading = [];
  composition_abstract: string;
  composition_title: string;
  composition_id: number;
  info_image: string;
  composition_edited: boolean;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
    this.HsEventBusService.compositionLoading
      .pipe(takeUntil(this.ngUnsubscribe))
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

    this.HsEventBusService.compositionLoads
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        if (data.error !== undefined) {
          const temp_abstract = this.composition_abstract;
          const temp_title = this.composition_title;
          this.composition_abstract = data.abstract;
          this.composition_title = data.title;
          this.info_image = 'icon-warning-sign';
          this.composition_title = temp_title;
          this.composition_abstract = temp_abstract;
          this.info_image = 'icon-map';
        }
        this.composition_loaded = true;
        this.composition_edited = false;
      });

    this.HsEventBusService.layerLoadings
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({layer, progress}) => {
        if (!this.layer_loading.includes(getTitle(layer))) {
          this.layer_loading.push(getTitle(layer));
          this.composition_loaded = false;
        }
      });

    this.HsEventBusService.layerLoads
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((layer) => {
        for (let i = 0; i < this.layer_loading.length; i++) {
          if (this.layer_loading[i] == getTitle(layer)) {
            this.layer_loading.splice(i, 1);
          }
        }

        if (this.layer_loading.length == 0 && !this.composition_loaded) {
          this.composition_loaded = true;
        }
      });

    this.HsEventBusService.compositionDeletes
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((composition) => {
        if (composition.id == this.composition_id) {
          delete this.composition_title;
          delete this.composition_abstract;
        }
      });

    this.HsEventBusService.mapResets
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        delete this.composition_title;
        delete this.composition_abstract;
        this.layer_loading.length = 0;
        this.composition_loaded = true;
        this.composition_edited = false;
      });

    this.HsEventBusService.compositionEdits
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.composition_edited = true;
      });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  trackByFn(index: number): number {
    return index; // or item.id
  }
  /**

   * @returns {boolean} Returns true if composition title available
   * @description Test if composition is loaded, to change info template.
   */
  compositionLoaded(): boolean {
    return this.composition_title !== undefined;
  }

  isVisible(): boolean {
    return this.HsLayoutService.panelEnabled('compositionLoadingProgress');
  }
}
