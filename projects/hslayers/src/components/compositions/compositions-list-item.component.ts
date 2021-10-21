import {Component, Input} from '@angular/core';

import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsToastService} from '../layout/toast/toast.service';
@Component({
  selector: 'hs-compositions-list-item',
  templateUrl: 'compositions-list-item.html',
})
export class HsCompositionsListItemComponent {
  @Input() composition;
  @Input() selectedCompId;
  constructor(
    public hsCompositionsService: HsCompositionsService,
    public hsLayoutService: HsLayoutService,
    public hsToastService: HsToastService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService
  ) {}

  /**
   * Load selected composition
   * @param composition - Selected composition
   */
  openComposition(composition): void {
    this.hsCompositionsService
      .loadCompositionParser(composition)
      .then(() => {
        //This should not be needed, as for that is the save map button created
        // this.HsSaveMapManagerService.openPanel(composition);
        this.hsLayoutService.setMainPanel('layermanager');
      })
      .catch(() => {
        //Do nothing
      });
  }
  /**
   * @param record Composition to show details
   * Load info about composition through service and display composition info dialog
   */
  async detailComposition(record): Promise<void> {
    const info = await this.hsCompositionsService.getCompositionInfo(record);
    if (info !== undefined) {
      this.infoDialogBootstrap(info);
    }
  }
  /**
   * @param record Composition to share
   * Prepare share object on server and display share dialog to share composition
   */
  async shareComposition(record): Promise<void> {
    let url: string;
    try {
      await this.hsCompositionsService
        .shareComposition(record)
        .then(async () => {
          url = await this.hsCompositionsService.getShareUrl();
          if (url !== undefined) {
            this.shareDialogBootstrap(record, url);
          } else {
            throw new Error('COMPOSITIONS.sharingUrlIsNotAvailable');
          }
        });
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileSharingOnSocialNetwork'
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.message,
          {url: url}
        ),
        {disableLocalization: true}
      );
    }
  }
  /**
   * @param composition Composition selected for deletion
   * @description Display delete dialog of composition
   */
  confirmDelete(composition): void {
    if (!composition.editable) {
      return;
    }
    this.deleteDialogBootstrap(composition);
  }
  /**
   * @param composition
   */
  deleteDialogBootstrap(composition): void {
    this.hsDialogContainerService.create(HsCompositionsDeleteDialogComponent, {
      compositionToDelete: composition,
    });
  }
  /**
   * @param record
   * @param url
   */
  shareDialogBootstrap(record, url): void {
    this.hsDialogContainerService.create(HsCompositionsShareDialogComponent, {
      url,
      title:
        this.hsConfig.social_hashtag &&
        !record.title.includes(this.hsConfig.social_hashtag)
          ? record.title + ' ' + this.hsConfig.social_hashtag
          : record.title,
      abstract: record.abstract,
    });
  }
  infoDialogBootstrap(info): void {
    this.hsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
      info,
    });
  }
}
