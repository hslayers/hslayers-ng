import {AsyncPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Observable, map} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {
  HsLayerManagerFolderService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getBase, setPath} from 'hslayers-ng/common/extensions';

import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {LayerFolderWidgetDialogComponent} from './layer-folder-dialog/layer-folder-dialog.component';

@Component({
  selector: 'hs-layer-folder-widget',
  standalone: true,
  imports: [AsyncPipe, TranslateCustomPipe],
  templateUrl: './layer-folder-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsLayerFolderWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  isEnabled: Observable<boolean>;

  hsDialogContainerService = inject(HsDialogContainerService);
  folderService = inject(HsLayerManagerFolderService);

  constructor(hsLayerSelectorService: HsLayerSelectorService) {
    super(hsLayerSelectorService);

    this.isEnabled = this.layerDescriptor.pipe(
      takeUntilDestroyed(),
      map((layer) => {
        return layer.layer && !getBase(layer.layer);
      }),
    );
  }

  /**
   * Creates new layer folder dialog
   */
  async createDialog() {
    const dialog = this.hsDialogContainerService.create(
      LayerFolderWidgetDialogComponent,
      {
        layer: this.olLayer,
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed.value) {
      this.moveLayerToNewFolder(confirmed.value);
    }
  }

  /**
   * Move layer to the selected folder
   */
  moveLayerToNewFolder(folder: string) {
    this.folderService.folderAction$.next(
      this.folderService.removeLayer(this.hsLayerSelectorService.currentLayer),
    );
    setPath(this.olLayer, folder);
    this.folderService.folderAction$.next(
      this.folderService.addLayer(this.hsLayerSelectorService.currentLayer),
    );
    this.folderService.folderAction$.next(this.folderService.sortByZ(false));
  }
}
