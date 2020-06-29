import { Component } from '@angular/core';
import { HsLayoutService } from '../layout/layout.service.js';
import { HsLayerManagerService } from './layermanager.service';

@Component({
  selector: 'hs-layermanager-gallery',
  template: require('./partials/basemap-gallery.html')
})
export class HsLayerManagerGalleryComponent {
  baseLayersExpanded: boolean = false;
  data: any;

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsLayerManagerService: HsLayerManagerService,
    private Window: Window) {
    this.data = this.HsLayerManagerService.data;
  }

  changeBaseLayerVisibility(toWhat: boolean, layer) {
    this.HsLayerManagerService.changeBaseLayerVisibility(toWhat, layer)
  }

  toggleMiniMenu(layer) {
    if (layer.galleryMiniMenu) {
      layer.galleryMiniMenu = !layer.galleryMiniMenu;
    } else {
      layer.galleryMiniMenu = true;
    }
  }

  fitting(a){
    return a.filter((element) => this.fitsInContainer())
  }

  toggleBasemap(layer) {
    if (arguments.length > 0) {
      if (!layer.active) {
        this.HsLayerManagerService.changeBaseLayerVisibility(true, layer);
        this.baseLayersExpanded = false;
      }
    } else {
      this.baseLayersExpanded = false;
      this.HsLayerManagerService.changeBaseLayerVisibility()
    }
  };

  galleryStyle() {
    if (
      !this.HsLayoutService.sidebarRight ||
      (this.HsLayoutService.layoutElement.clientWidth <= 767 &&
        this.Window.innerWidth <= 767)
    ) {
      return { right: '15px' };
    } else {
      return { right: this.HsLayoutService.panelSpaceWidth() + 20 + 'px' };
    }
  };

  fitsInContainer = () => {
    return (
      (this.HsLayerManagerService.data.baselayers.length + 1) * 150 <
      this.HsLayoutService.layoutElement.clientWidth -
      this.HsLayoutService.panelSpaceWidth() -
      450
    );
  };

  setGreyscale(layer) {
    const layerContainer = document.querySelector(
      '.ol-unselectable > div:first-child'
    );
    if (layerContainer.classList.contains('hs-grayscale')) {
      layerContainer.classList.remove('hs-grayscale');
      layer.grayscale = false;
    } else {
      layerContainer.classList.add('hs-grayscale');
      layer.grayscale = true;
    }
    setTimeout(() => {
      layer.galleryMiniMenu = false;
    }, 100);
  };
}