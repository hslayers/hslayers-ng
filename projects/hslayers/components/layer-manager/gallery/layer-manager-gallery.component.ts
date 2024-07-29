import {ChangeDetectionStrategy, Component, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NgbDropdown, NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getBase, getGreyscale} from 'hslayers-ng/common/extensions';

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
    public hsLayerManagerService: HsLayerManagerService,
    private hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
  ) {
    super();
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
        this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
          true,
          layer,
        );
        this.dropdown.close();
        this.hsLayerManagerService.menuExpanded = false;
        const olLayer = this.hsLayerSelectorService.currentLayer?.layer;
        if (!olLayer || getBase(olLayer)) {
          this.hsLayerSelectorService.currentLayer = null;
        }
      }
    } else {
      this.dropdown.close();
      this.hsLayerSelectorService.currentLayer = null;

      this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
        null,
        null,
      );
    }
  }
  expandMenu(layer: HsLayerDescriptor): void {
    this.hsLayerManagerService.toggleLayerEditor(layer, 'settings');
    this.hsLayerManagerService.menuExpanded =
      !this.hsLayerManagerService.menuExpanded;
  }
}
