import {ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsPanelBaseComponent} from '../../layout/panels/panel-base.component';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';
import {getBase, getGreyscale} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-layermanager-gallery',
  templateUrl: './basemap-gallery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsLayerManagerGalleryComponent extends HsPanelBaseComponent {
  menuExpanded = false;
  getGreyscale = getGreyscale;
  @ViewChild('galleryDropdown', {static: false}) dropdown: NgbDropdown;
  constructor(
    public hsLayoutService: HsLayoutService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerUtilsService: HsLayerUtilsService //Used in template
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
        this.hsLayerManagerService.changeBaseLayerVisibility(
          true,
          layer,
          this.data.app
        );
        this.dropdown.close();
        this.hsLayerManagerService.apps[this.data.app].menuExpanded = false;
        const olLayer =
          this.hsLayerManagerService.apps[this.data.app].currentLayer?.layer;
        if (!olLayer || getBase(olLayer)) {
          this.hsLayerManagerService.apps[this.data.app].currentLayer = null;
        }
      }
    } else {
      this.dropdown.close();
      this.hsLayerManagerService.apps[this.data.app].currentLayer = null;

      this.hsLayerManagerService.changeBaseLayerVisibility(
        null,
        null,
        this.data.app
      );
    }
  }
  expandMenu(layer: HsLayerDescriptor): void {
    this.hsLayerManagerService.toggleLayerEditor(
      layer,
      'settings',
      'sublayers',
      this.data.app
    );
    this.hsLayerManagerService.apps[this.data.app].menuExpanded =
      !this.hsLayerManagerService.apps[this.data.app].menuExpanded;
  }

  isVisible(): boolean {
    return (
      this.hsLayoutService.componentEnabled('basemapGallery', this.data.app) &&
      this.hsLayoutService.componentEnabled('guiOverlay', this.data.app)
    );
  }
}
