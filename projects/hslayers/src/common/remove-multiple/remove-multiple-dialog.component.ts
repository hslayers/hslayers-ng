import {Component, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../components/layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../components/layout/dialogs/dialog-item';
import {HsLanguageService} from '../../components/language/language.service';
import {Layer} from 'ol/layer';
import {getTitle} from '../layer-extensions';

@Component({
  selector: 'hs-rm-multiple-dialog',
  templateUrl: './remove-multiple-dialog.html',
})
export class HsRmMultipleDialogComponent implements HsDialogComponent, OnInit {
  dialogItem: HsDialogItem;
  _selectAll = false;
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService
  ) {}
  viewRef: ViewRef;
  data: {
    title: string;
    message: string;
    note?: string;
    items?: any[];

  };

  ngOnInit(): void {
    for (const item of this.data.items) {
      item.displayTitle = this.getTitle(item);
    }
  }
  yes(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('yes');
  }

  no(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('no');
  }

  checkToRemove(item): void {
    if (item.toRemove !== undefined) {
      item.toRemove = !item.toRemove;
    } else {
      item.toRemove = true;
    }
  }

  selectDeselectAll(): void {
    this._selectAll = !this._selectAll;
    for (const item of this.data.items) {
      item.toRemove = this._selectAll;
    }
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
