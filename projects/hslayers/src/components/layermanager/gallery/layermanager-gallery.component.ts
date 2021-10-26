import {Component, ViewChild} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsConfig} from '../../../config.service';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsPanelBaseComponent} from '../../layout/panels/panel-base.component';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';
import {getBase} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-layermanager-gallery',
  templateUrl: './basemap-gallery.html',
})
export class HsLayerManagerGalleryComponent extends HsPanelBaseComponent {
  menuExpanded = false;
  @ViewChild('galleryDropdown', {static: false}) dropdown: NgbDropdown;

  constructor(
    public HsLayoutService: HsLayoutService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsConfig: HsConfig,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {
    super(HsLayoutService);
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
        this.dropdown.close();
        this.HsLayerManagerService.menuExpanded = false;
        const olLayer = this.HsLayerManagerService.currentLayer?.layer;
        if (!olLayer || getBase(olLayer)) {
          this.HsLayerManagerService.currentLayer = null;
        }
      }
    } else {
      this.dropdown.close();
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

  isVisible(): boolean {
    return (
      this.HsLayoutService.componentEnabled('basemapGallery') &&
      this.HsLayoutService.componentEnabled('guiOverlay')
    );
  }
}
