import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayoutService} from '../layout/layout.service';

import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {Layer} from 'ol/layer';

@Component({
  selector: 'hs-layermanager-gallery',
  templateUrl: './partials/basemap-gallery.html',
})
export class HsLayerManagerGalleryComponent {
  baseLayersExpanded = false;
  menuExpanded = false;
  data: any;

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsLayerManagerService: HsLayerManagerService,
    private Window: Window,
    private HsConfig: HsConfig,
    private HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {
    this.data = this.HsLayerManagerService.data;
  }

  changeBaseLayerVisibility(toWhat: boolean, layer: Layer): void {
    this.HsLayerManagerService.changeBaseLayerVisibility(toWhat, layer);
  }

  toggleMiniMenu(layer: Layer): void {
    if (layer.galleryMiniMenu) {
      layer.galleryMiniMenu = !layer.galleryMiniMenu;
    } else {
      layer.galleryMiniMenu = true;
    }
  }

  toggleBasemap(layer: Layer): void {
    if (arguments.length > 0) {
      if (!layer.active) {
        this.HsLayerManagerService.changeBaseLayerVisibility(true, layer);
        this.baseLayersExpanded = false;
        this.HsLayerManagerService.menuExpanded = false;
        if (this.HsLayerManagerService.currentLayer?.layer.get('base')) {
          this.HsLayerManagerService.currentLayer = null;
        }
      }
    } else {
      this.baseLayersExpanded = false;
      this.HsLayerManagerService.currentLayer = null;

      this.HsLayerManagerService.changeBaseLayerVisibility();
    }
  }
  expandMenu(layer) {
    this.HsLayerManagerService.toggleLayerEditor(
      layer,
      'settings',
      'sublayers'
    );
    this.HsLayerManagerService.menuExpanded = !this.HsLayerManagerService
      .menuExpanded;
  }
}
