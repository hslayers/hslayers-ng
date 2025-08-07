import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NgbDropdown, NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsGalleryEditorDialogComponent} from './gallery-editor-dialog.component';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {getBase} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-manager-gallery',
  templateUrl: './layer-manager-gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, NgbDropdownModule],
})
export class HsLayerManagerGalleryComponent extends HsGuiOverlayBaseComponent {
  hsLayerManagerService = inject(HsLayerManagerService);
  private hsLayerSelectorService = inject(HsLayerSelectorService);
  hsLayerManagerVisibilityService = inject(HsLayerManagerVisibilityService);

  @ViewChild('galleryDropdown', {static: false}) dropdown: NgbDropdown;
  name = 'basemapGallery';

  private hsDialogContainerService = inject(HsDialogContainerService);

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
