import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NgbDropdown, NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsGalleryEditorDialogComponent} from './gallery-editor-dialog.component';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getBase} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-manager-gallery',
  templateUrl: './layer-manager-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, TranslateCustomPipe, NgbDropdownModule],
})
export class HsLayerManagerGalleryComponent extends HsGuiOverlayBaseComponent {
  @ViewChild('galleryDropdown', {static: false}) dropdown: NgbDropdown;
  name = 'basemapGallery';

  private hsDialogContainerService = inject(HsDialogContainerService);

  constructor(
    public hsLayerManagerService: HsLayerManagerService,
    private hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
  ) {
    super();
  }

  toggleBasemap(layer?: HsLayerDescriptor): void {
    if (layer) {
      if (!layer.active) {
        this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
          true,
          layer,
        );
        this.dropdown.close();
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
    this.hsDialogContainerService.create(HsGalleryEditorDialogComponent, {
      layer,
    });
  }
}
