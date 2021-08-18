import {Component} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {getBase} from '../../common/layer-extensions';

@Component({
  selector: 'hs-layermanager-gallery',
  templateUrl: './partials/basemap-gallery.html',
})
export class HsLayerManagerGalleryComponent {
  baseLayersExpanded = false;
  menuExpanded = false;
  data: any;

  constructor(
    public HsLayoutService: HsLayoutService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsConfig: HsConfig,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {
    this.data = this.HsLayerManagerService.data;
  }

  changeBaseLayerVisibility(toWhat: boolean, layer: Layer<Source>): void {
    this.HsLayerManagerService.changeBaseLayerVisibility(toWhat, layer);
  }

  toggleMiniMenu(layer: HsLayerDescriptor): void {
    if (layer.galleryMiniMenu) {
      layer.galleryMiniMenu = !layer.galleryMiniMenu;
    } else {
      layer.galleryMiniMenu = true;
    }
  }

  toggleBasemap(layer?: HsLayerDescriptor): void {
    if (layer) {
      if (!layer.active) {
        this.HsLayerManagerService.changeBaseLayerVisibility(true, layer);
        this.baseLayersExpanded = false;
        this.HsLayerManagerService.menuExpanded = false;
        const olLayer = this.HsLayerManagerService.currentLayer?.layer;
        if (!olLayer || getBase(olLayer)) {
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
    this.HsLayerManagerService.menuExpanded =
      !this.HsLayerManagerService.menuExpanded;
  }
}
