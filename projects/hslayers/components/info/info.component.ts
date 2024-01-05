import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsGuiOverlayBaseComponent} from '../../common/panels/gui-overlay-base.component';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-info',
  templateUrl: './info.component.html',
})
export class HsInfoComponent
  extends HsGuiOverlayBaseComponent
  implements OnDestroy
{
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
  composition_id: string;
  info_image: string;
  composition_edited: boolean;

  name = 'info';
  private end = new Subject<void>();
  constructor(
    private hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    private hsConfig: HsConfig,
  ) {
    super(hsLayoutService);
    this.hsEventBusService.compositionLoads
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
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
      .subscribe(({layer, progress}) => {
        if (!this.layer_loading.includes(getTitle(layer))) {
          this.layer_loading.push(getTitle(layer));
          this.composition_loaded = false;
        }
      });

    this.hsEventBusService.layerLoads
      .pipe(takeUntil(this.end))
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

    this.hsEventBusService.compositionDeletes
      .pipe(takeUntil(this.end))
      .subscribe((composition) => {
        if (composition.id == this.composition_id) {
          delete this.composition_title;
          delete this.composition_abstract;
        }
      });

    this.hsEventBusService.mapResets.pipe(takeUntil(this.end)).subscribe(() => {
      delete this.composition_title;
      delete this.composition_abstract;
      this.layer_loading.length = 0;
      this.composition_loaded = true;
      this.composition_edited = false;
    });

    this.hsEventBusService.compositionEdits
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.composition_edited = true;
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
   * Test if composition is loaded, to change info template.
   * @returns Returns true if composition title available
   */
  compositionLoaded(): boolean {
    return this.composition_title !== undefined;
  }

  isVisible(): boolean {
    return this.hsLayoutService.panelEnabled('compositionLoadingProgress');
  }
}
