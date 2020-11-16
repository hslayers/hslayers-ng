import {Component} from '@angular/core';
import {HsEventBusService} from './../core/event-bus.service';
import {HsUtilsService} from './../utils/utils.service';
/**
 * @memberof hs.info
 * @ngdoc component
 * @name HsInfoComponent
 */
@Component({
  selector: 'hs-info',
  templateUrl: './partials/info.html',
})
export class HsInfoComponent {
  /**
   * @ngdoc property
   * @name hs.info#composition_loaded
   * @public
   * @type {boolean} true
   * @description Store if composition is loaded
   */
  composition_loaded = true;
  /**
   * @ngdoc property
   * @name hs.info#layer_loading
   * @public
   * @type {Array} null
   * @description List of layers which are currently loading.
   */
  layer_loading = [];
  composition_abstract: string;
  composition_title: string;
  composition_id: number;
  info_image: string;
  composition_edited: boolean;
  constructor(
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService
  ) {
    this.HsEventBusService.compositionLoading.subscribe((data) => {
      if (data.error === undefined) {
        if (data.data !== undefined) {
          /**
           * @ngdoc property
           * @name hs.info#composition_abstract
           * @public
           * @type {string} null
           * @description Abstract of current composition (filled when first composition is loaded)
           */
          this.composition_abstract = data.data.abstract;
          /**
           * @ngdoc property
           * @name hs.info#composition_title
           * @public
           * @type {string} null
           * @description Title of current composition (filled when first composition is loaded)
           */
          this.composition_title = data.data.title;
          /**
           * @ngdoc property
           * @name hs.info#composition_id
           * @public
           * @type {number} null
           * @description Id of current composition (filled when first composition is loaded)
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
    });
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
       * @ngdoc property
       * @name hs.info#composition_edited
       * @public
       * @type {boolean} null
       * @description Status of composition edit (true for edited composition)
       */
      this.composition_edited = false;
    });
    this.HsEventBusService.layerLoadings.subscribe((layer) => {
      if (!(layer.get('title') in this.layer_loading)) {
        this.layer_loading.push(layer.get('title'));
      }
      this.composition_loaded = false;
    });
    this.HsEventBusService.layerLoads.subscribe((layer) => {
      for (let i = 0; i < this.layer_loading.length; i++) {
        if (this.layer_loading[i] == layer.get('title')) {
          this.layer_loading.splice(i, 1);
        }
      }

      if (this.layer_loading.length == 0) {
        if (!this.composition_loaded) {
          this.composition_loaded = true;
        }
      }
    });

    this.HsEventBusService.compositionDeletes.subscribe((composition) => {
      if (composition.id == this.composition_id) {
        delete this.composition_title;
        delete this.composition_abstract;
      }
    });

    this.HsEventBusService.mapResets.subscribe(() => {
      delete this.composition_title;
      delete this.composition_abstract;
      this.layer_loading.length = 0;
      this.composition_loaded = true;
      this.composition_edited = false;
    });
    this.HsEventBusService.compositionEdits.subscribe(() => {
      this.composition_edited = true;
    });
  }
  trackByFn(index: number): number {
    return index; // or item.id
  }
  /**
   * @ngdoc method
   * @name hs.info#compositionLoaded
   * @public
   * @returns {boolean} Returns true if composition title available
   * @description Test if composition is loaded, to change info template.
   */
  compositionLoaded(): boolean {
    return this.composition_title !== undefined;
  }
  //this.$emit('scope_loaded', 'info');
}
