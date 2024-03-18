import {Component, OnInit, ViewRef} from '@angular/core';

import {Layer} from 'ol/layer';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDialogItem} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {
  HsRemoveLayerDialogService,
  RemoveLayerWrapper,
} from './remove-layer-dialog.service';
import {getName, getTitle} from 'hslayers-ng/common/extensions';

/**
 * Both catalogue and mapcatalogue will remove layer from  map as well.
 * Difference is with layer 'form' - string vs Layer<Source> (see service removeMultipleLayers overloads)
 * string - Name param from Layman layer descriptor. Not all layers are guaranteed to be in map
 * Layer<Source> - OL layer. Layers already in map
 */
export type HsRmLayerDialogDeleteOptions = 'map' | 'catalogue' | 'mapcatalogue';

export type HsRmLayerDialogResponse = {
  value: 'yes' | 'no';
  type?: HsRmLayerDialogDeleteOptions;
};

@Component({
  selector: 'hs-rm-layer-dialog',
  templateUrl: './remove-layer-dialog.component.html',
  styles: `
    .modal-title {
      white-space: nowrap;
      width: 100%;
    }
    .modal-title span {
      max-width: 18ch;
    }
  `,
})
export class HsRmLayerDialogComponent implements HsDialogComponent, OnInit {
  dialogItem: HsDialogItem;
  _selectAll = false;
  isAuthenticated: boolean;

  deleteFrom: (typeof this.data)['deleteFromOptions'][number];

  deleteAllowed = false;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public service: HsRemoveLayerDialogService,
    private hsLanguageService: HsLanguageService,
    private commonLaymanService: HsCommonLaymanService,
  ) {}
  viewRef: ViewRef;
  /**
   * @param deleteFromOptions - From where the layer should be deleted eg. map, catalogue map&catalogue
   */
  data: {
    multiple: boolean;
    title: string;
    deleteFromOptions?: HsRmLayerDialogDeleteOptions[];
    message: string;
    note?: string;
    items?: RemoveLayerWrapper[];
  };

  ngOnInit(): void {
    this.isAuthenticated = this.commonLaymanService.isAuthenticated();
    this.data.deleteFromOptions ??= ['map', 'mapcatalogue'];
    if (!this.isAuthenticated || this.data.deleteFromOptions.length === 1) {
      this.deleteFrom = this.data.deleteFromOptions[0];
      this.deleteAllowed = !this.data.multiple;
    }
    if (this.data.items) {
      for (const item of this.data.items) {
        item.displayTitle = this.getTitle(item);
      }
    }
  }
  yes(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve({value: 'yes', type: this.deleteFrom});
  }

  no(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve({value: 'no'});
  }

  selectDeleteOption(option) {
    this.deleteFrom = option;
    /**
     * If removing only one layer checkboxes are not available thus we need
     * to disable delete button
     */
    this.deleteAllowed = !this.data.multiple ? true : this.deleteAllowed;
  }

  checkToRemove(item): void {
    if (item.toRemove !== undefined) {
      item.toRemove = !item.toRemove;
    } else {
      item.toRemove = true;
    }
    this.deleteAllowed = !!this.data.items.find((i) => i.toRemove);
  }

  toggleAll(): void {
    this._selectAll = !this._selectAll;
    for (const item of this.data.items) {
      item.toRemove = this._selectAll;
    }
    this.deleteAllowed = !!this.data.items.find((i) => i.toRemove);
  }

  getTitle(item: RemoveLayerWrapper): string {
    let title =
      item.layer instanceof Layer
        ? getTitle(item.layer) ?? getName(item.layer)
        : item.layer;
    if (!title) {
      title = this.hsLanguageService.getTranslation(
        'COMMON.unknown',
        undefined,
      );
    }
    return title;
  }
}
