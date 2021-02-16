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
export class HsCompostionsListItemComponent {
  @Input() composition;
  @Input() selectedCompId;
  constructor(
    public HsCompositionsService: HsCompositionsService,
    public HsLayoutService: HsLayoutService,
    public HsToastService: HsToastService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService
  ) {}

  /**
   * @function openComposition
   * Load selected composition
   * @param composition Selected composition
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
   * @param record Composition to show details
   * Load info about composition through service and display composition info dialog
   */
  async detailComposition(record): Promise<void> {
    const info = await this.HsCompositionsService.getCompositionInfo(record);
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
      await this.HsCompositionsService.shareComposition(record).then(
        async () => {
          url = await this.HsCompositionsService.getShareUrl();
          if (url !== undefined) {
            this.shareDialogBootstrap(record, url);
          } else {
            throw new Error('COMPOSITIONS.sharingUrlIsNotAvailable');
          }
        }
      );
    } catch (ex) {
      this.HsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileSharingOnSocialNetwork'
        ),
        this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          ex.statusText || ex.message,
          {value: url}
        ),
        true
      );
    }
  }
  /**
   * @param composition Composition selected for deletion
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
