import {Component} from '@angular/core';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsConfig} from '../../config.service';

import {Layer} from 'ol/layer';

@Component({
  selector: 'hs-layermanager-gallery',
  template: require('./partials/basemap-gallery.html'),
})
export class HsLayerManagerGalleryComponent {
  baseLayersExpanded = false;
  data: any;

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsLayerManagerService: HsLayerManagerService,
    private Window: Window,
    private HsConfig: HsConfig,
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

  fitting(a) {
    return a.filter((element) => this.fitsInContainer());
  }

  toggleBasemap(layer: Layer): void {
    if (arguments.length > 0) {
      if (!layer.active) {
        this.HsLayerManagerService.changeBaseLayerVisibility(true, layer);
        this.baseLayersExpanded = false;
      }
    } else {
      this.baseLayersExpanded = false;
      this.HsLayerManagerService.changeBaseLayerVisibility();
    }
  }

  fitsInContainer(): boolean {
    return (
      (this.HsLayerManagerService.data.baselayers.length + 1) * 150 <
      this.HsLayoutService.layoutElement.clientWidth -
        this.HsLayoutService.panelSpaceWidth() -
        450
    );
  }
}
