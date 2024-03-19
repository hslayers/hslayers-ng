import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
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

  private end = new Subject<void>();

  //Show layer loading only in case layermanager is not the main panel
  showLayerLoading = this.hsLayoutService.mainpanel$.pipe(
    takeUntil(this.end),
    map((panel) => panel !== 'layerManager'),
  );
  name = 'info';
  constructor(private hsEventBusService: HsEventBusService) {
    super();
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

    this.hsEventBusService.layerLoading
      .pipe(takeUntil(this.end))
      .subscribe(({layer, progress}) => {
        if (!this.layer_loading.includes(getTitle(layer))) {
          this.layer_loading.push(getTitle(layer));
          this.composition_loaded = false;
        }
      });

    this.hsEventBusService.layerLoaded
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
