import {Component, Input, ViewChild} from '@angular/core';

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
  @Input() app = 'default';
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
        this.HsLayerManagerService.changeBaseLayerVisibility(
          true,
          layer,
          this.app
        );
        this.dropdown.close();
        this.HsLayerManagerService.apps[this.app].menuExpanded = false;
        const olLayer =
          this.HsLayerManagerService.apps[this.app].currentLayer?.layer;
        if (!olLayer || getBase(olLayer)) {
          this.HsLayerManagerService.apps[this.app].currentLayer = null;
        }
      }
    } else {
      this.dropdown.close();
      this.HsLayerManagerService.apps[this.app].currentLayer = null;

      this.HsLayerManagerService.changeBaseLayerVisibility(
        null,
        null,
        this.app
      );
    }
  }
  expandMenu(layer) {
    this.HsLayerManagerService.toggleLayerEditor(
      layer,
      'settings',
      'sublayers',
      this.app
    );
    this.HsLayerManagerService.apps[this.app].menuExpanded =
      !this.HsLayerManagerService.apps[this.app].menuExpanded;
  }

  isVisible(): boolean {
    return (
      this.HsLayoutService.componentEnabled('basemapGallery', this.app) &&
      this.HsLayoutService.componentEnabled('guiOverlay', this.app)
    );
  }
}
