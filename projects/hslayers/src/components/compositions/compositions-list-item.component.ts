/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, Input} from '@angular/core';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';

@Component({
  selector: 'hs-compositions-list-item',
  templateUrl: 'compositions-list-item.html',
})
export class HsCompostionsListItemComponent {
  @Input() composition;
  @Input() selectedCompId;
  constructor(
    public HsCompositionsService: HsCompositionsService,
    public HsLayoutService: HsLayoutService,
    public HsLogService: HsLogService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsConfig: HsConfig
  ) {}

  /**
   * @function openComposition
   * @description Load selected composition
   * @param {object} composition Selected composition
   */
  openComposition(composition): void {
    this.HsCompositionsService.loadCompositionParser(composition)
      .then(() => {
        //This should not be needed, as for that is the save map button created
        // this.HsSaveMapManagerService.openPanel(composition);
        this.HsLayoutService.setMainPanel('layermanager');
      })
      .catch(() => {
        //Do nothing
      });
  }
  /**
   * @public
   * @param {object} record Composition to show details
   * @description Load info about composition through service and display composition info dialog
   */
  detailComposition(record): void {
    this.HsCompositionsService.getCompositionInfo(record, (info) => {
      this.infoDialogBootstrap(info);
    });
  }
  /**
   * @public
   * @param {object} record Composition to share
   * @description Prepare share object on server and display share dialog to share composition
   */
  async shareComposition(record): Promise<void> {
    try {
      await this.HsCompositionsService.shareComposition(record).then(
        async () => {
          const url = await this.HsCompositionsService.getShareUrl();
          this.shareDialogBootstrap(record, url);
        }
      );
    } catch (ex) {
      this.HsLogService.error(ex);
    }
  }
  /**
   * @public
   * @param {object} composition Composition selected for deletion
   * @description Display delete dialog of composition
   */
  confirmDelete(composition): void {
    this.deleteDialogBootstrap(composition);
  }
  /**
   * @param composition
   */
  deleteDialogBootstrap(composition): void {
    this.HsDialogContainerService.create(HsCompositionsDeleteDialogComponent, {
      compositionToDelete: composition,
    });
  }
  /**
   * @param record
   * @param url
   */
  shareDialogBootstrap(record, url): void {
    this.HsDialogContainerService.create(HsCompositionsShareDialogComponent, {
      url,
      title:
        this.HsConfig.social_hashtag &&
        !record.title.includes(this.HsConfig.social_hashtag)
          ? record.title + ' ' + this.HsConfig.social_hashtag
          : record.title,
      abstract: record.abstract,
    });
  }
  infoDialogBootstrap(info): void {
    this.HsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
      info,
    });
  }
}
