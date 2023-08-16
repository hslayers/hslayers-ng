import {ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';

import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsPanelBaseComponent} from '../../layout/panels/panel-base.component';
import {getBase, getGreyscale} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-layermanager-gallery',
  templateUrl: './layermanager-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsLayerManagerGalleryComponent extends HsPanelBaseComponent {
  menuExpanded = false;
  getGreyscale = getGreyscale;
  @ViewChild('galleryDropdown', {static: false}) dropdown: NgbDropdown;
  constructor(
    public hsLayoutService: HsLayoutService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerUtilsService: HsLayerUtilsService,
  ) {
    super(hsLayoutService);
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
        this.hsLayerManagerService.changeBaseLayerVisibility(true, layer);
        this.dropdown.close();
        this.hsLayerManagerService.menuExpanded = false;
        const olLayer = this.hsLayerManagerService.currentLayer?.layer;
        if (!olLayer || getBase(olLayer)) {
          this.hsLayerManagerService.currentLayer = null;
        }
      }
    } else {
      this.dropdown.close();
      this.hsLayerManagerService.currentLayer = null;

      this.hsLayerManagerService.changeBaseLayerVisibility(null, null);
    }
  }
  expandMenu(layer: HsLayerDescriptor): void {
    this.hsLayerManagerService.toggleLayerEditor(
      layer,
      'settings',
      'sublayers',
    );
    this.hsLayerManagerService.menuExpanded =
      !this.hsLayerManagerService.menuExpanded;
  }

  isVisible(): boolean {
    return (
      this.hsLayoutService.componentEnabled('basemapGallery') &&
      this.hsLayoutService.componentEnabled('guiOverlay')
    );
  }
}
