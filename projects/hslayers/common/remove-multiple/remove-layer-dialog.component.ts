import {Component, OnInit, ViewRef} from '@angular/core';
import {Layer} from 'ol/layer';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsDialogComponent} from 'hslayers-ng/components/layout';
import {HsDialogContainerService} from 'hslayers-ng/components/layout';
import {HsDialogItem} from 'hslayers-ng/components/layout';
import {HsLanguageService} from 'hslayers-ng/components/language';
import {HsRemoveLayerDialogService} from './remove-layer-dialog.service';
import {getTitle} from '../extensions/layer-extensions';

export type HsRmLayerDialogResponse = {
  value: 'yes' | 'no';
  type?: string;
};

@Component({
  selector: 'hs-rm-layer-dialog',
  templateUrl: './remove-layer-dialog.component.html',
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
    items?: any[];
  };

  ngOnInit(): void {
    this.isAuthenticated = this.commonLaymanService.isAuthenticated();
    if (!this.isAuthenticated) {
      this.deleteFrom = this.deleteFromOptions[0];
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

  checkToRemove(item): void {
    if (item.toRemove !== undefined) {
      item.toRemove = !item.toRemove;
    } else {
      item.toRemove = true;
    }
    this.deleteAllowed = this.data.items.find((i) => i.toRemove);
  }

  toggleAll(): void {
    this._selectAll = !this._selectAll;
    for (const item of this.data.items) {
      item.toRemove = this._selectAll;
    }
    this.deleteAllowed = this.data.items.find((i) => i.toRemove);
  }

  getTitle(item): string {
    let title = item instanceof Layer ? getTitle(item) : item.name;
    if (!title) {
      title = this.hsLanguageService.getTranslation(
        'COMMON.unknown',
        undefined,
      );
    }
    return title;
  }
}
