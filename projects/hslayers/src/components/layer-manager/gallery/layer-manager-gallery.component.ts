import {ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NgbDropdown, NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsGuiOverlayBaseComponent} from '../../layout/panels/gui-overlay-base.component';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerService} from '../layer-manager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {TranslateCustomPipe} from '../../language/translate-custom.pipe';
import {getBase, getGreyscale} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-layer-manager-gallery',
  templateUrl: './layer-manager-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, TranslateCustomPipe, NgbDropdownModule],
})
export class HsLayerManagerGalleryComponent extends HsGuiOverlayBaseComponent {
  menuExpanded = false;
  getGreyscale = getGreyscale;
  @ViewChild('galleryDropdown', {static: false}) dropdown: NgbDropdown;
  name = 'basemapGallery';
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
}
