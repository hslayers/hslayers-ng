import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from './../core/event-bus.service';
import {HsUtilsService} from './../utils/utils.service';
import {getTitle} from '../../common/layer-extensions';
/**
 * HsInfoComponent
 */
@Component({
  selector: 'hs-info',
  templateUrl: './partials/info.html',
})
export class HsInfoComponent implements OnDestroy {
  /**
   * @type {boolean} true
   * Store if composition is loaded
   */
  composition_loaded = true;
  /**
   * @type {Array} null
   * List of layers which are currently loading.
   */
  layer_loading = [];
  composition_abstract: string;
  composition_title: string;
  composition_id: number;
  info_image: string;
  composition_edited: boolean;
  subscriptions: Subscription[] = [];
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService
  ) {
    this.subscriptions.push(
      this.HsEventBusService.compositionLoading.subscribe((data) => {
        if (data.error === undefined) {
          if (data.data !== undefined) {
            /**
             * @type {string} null
             * Abstract of current composition (filled when first composition is loaded)
             */
            this.composition_abstract = data.data.abstract;
            /**
             * @type {string} null
             * Title of current composition (filled when first composition is loaded)
             */
            this.composition_title = data.data.title;
            /**
             * @type {number} null
             * Id of current composition (filled when first composition is loaded)
             */
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
      })
    );
    this.subscriptions.push(
      this.HsEventBusService.compositionLoads.subscribe((data) => {
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
        /**
         * @type {boolean} null
         * Status of composition edit (true for edited composition)
         */
        this.composition_edited = false;
      })
    );
    this.subscriptions.push(
      this.HsEventBusService.layerLoadings.subscribe((layer) => {
        if (!(getTitle(layer) in this.layer_loading)) {
          this.layer_loading.push(getTitle(layer));
        }
        this.composition_loaded = false;
      })
    );
    this.subscriptions.push(
      this.HsEventBusService.layerLoads.subscribe((layer) => {
        for (let i = 0; i < this.layer_loading.length; i++) {
          if (this.layer_loading[i] == getTitle(layer)) {
            this.layer_loading.splice(i, 1);
          }
        }

        if (this.layer_loading.length == 0) {
          if (!this.composition_loaded) {
            this.composition_loaded = true;
          }
        }
      })
    );

    this.subscriptions.push(
      this.HsEventBusService.compositionDeletes.subscribe((composition) => {
        if (composition.id == this.composition_id) {
          delete this.composition_title;
          delete this.composition_abstract;
        }
      })
    );

    this.subscriptions.push(
      this.HsEventBusService.mapResets.subscribe(() => {
        delete this.composition_title;
        delete this.composition_abstract;
        this.layer_loading.length = 0;
        this.composition_loaded = true;
        this.composition_edited = false;
      })
    );
    this.subscriptions.push(
      this.HsEventBusService.compositionEdits.subscribe(() => {
        this.composition_edited = true;
      })
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  trackByFn(index: number): number {
    return index; // or item.id
  }
  /**
   * @returns Returns true if composition title available
   * Test if composition is loaded, to change info template.
   */
  compositionLoaded(): boolean {
    return this.composition_title !== undefined;
  }
  //this.$emit('scope_loaded', 'info');
}
