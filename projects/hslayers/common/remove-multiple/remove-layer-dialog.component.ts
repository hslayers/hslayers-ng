import {Component, OnInit, ViewRef} from '@angular/core';

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

export type HsRmLayerDialogResponse = {
  value: 'yes' | 'no';
  type?: string;
};

@Component({
  selector: 'hs-rm-layer-dialog',
  templateUrl: './remove-layer-dialog.component.html',
  styles: `
    .modal-title{
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

  deleteFromOptions = ['map', 'catalogue'] as const;
  deleteFrom: (typeof this.deleteFromOptions)[number];

  deleteAllowed = false;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public service: HsRemoveLayerDialogService,
    private hsLanguageService: HsLanguageService,
    private commonLaymanService: HsCommonLaymanService,
  ) {}
  viewRef: ViewRef;
  data: {
    multiple: boolean;
    title: string;
    message: string;
    note?: string;
    items?: RemoveLayerWrapper[];
  };

  ngOnInit(): void {
    this.isAuthenticated = this.commonLaymanService.isAuthenticated();
    if (!this.isAuthenticated) {
      this.deleteFrom = this.deleteFromOptions[0];
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
     * If removing only one layer checkboxes are not avaialable thus we need
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
    let title = getTitle(item.layer) ?? getName(item.layer);
    if (!title) {
      title = this.hsLanguageService.getTranslation(
        'COMMON.unknown',
        undefined,
      );
    }
    return title;
  }
}
