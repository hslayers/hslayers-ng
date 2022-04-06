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
  templateUrl: 'compositions-list-item.component.html',
})
export class HsCompositionsListItemComponent {
  @Input() composition;
  @Input() selectedCompId;
  @Input() app = 'default';
  constructor(
    private hsCompositionsService: HsCompositionsService,
    private hsLayoutService: HsLayoutService,
    private hsToastService: HsToastService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsConfig: HsConfig,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Load selected composition
   * @param composition - Selected composition
   */
  openComposition(composition): void {
    this.hsCompositionsService.loadCompositionParser(composition, this.app);
  }
  /**
   * @param record - Composition to show details
   * Load info about composition through service and display composition info dialog
   */
  async detailComposition(record): Promise<void> {
    const info = await this.hsCompositionsService.getCompositionInfo(
      record,
      this.app
    );
    if (info !== undefined) {
      this.infoDialogBootstrap(info);
    }
  }
  /**
   * @param record - Composition to share
   * Prepare share object on server and display share dialog to share composition
   */
  async shareComposition(record): Promise<void> {
    let url: string;
    try {
      await this.hsCompositionsService
        .shareComposition(record, this.app)
        .then(async () => {
          url = await this.hsCompositionsService.getShareUrl(this.app);
          if (url !== undefined) {
            this.shareDialogBootstrap(record, url);
          } else {
            throw new Error('COMPOSITIONS.sharingUrlIsNotAvailable');
          }
        });
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileSharingOnSocialNetwork',
          undefined,
          this.app
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.message,
          {url: url},
          this.app
        ),
        {disableLocalization: true},
        this.app
      );
    }
  }
  /**
   * @param composition - Composition selected for deletion
   * Display delete dialog of composition
   */
  confirmDelete(composition): void {
    if (!composition.editable) {
      return;
    }
    this.deleteDialogBootstrap(composition);
  }
  /**
   * @param composition -
   */
  deleteDialogBootstrap(composition): void {
    this.hsDialogContainerService.create(
      HsCompositionsDeleteDialogComponent,
      {
        compositionToDelete: composition,
      },
      this.app
    );
  }
  /**
   * @param record -
   * @param url -
   */
  shareDialogBootstrap(record, url): void {
    this.hsDialogContainerService.create(
      HsCompositionsShareDialogComponent,
      {
        url,
        title:
          this.hsConfig.get(this.app).social_hashtag &&
          !record.title.includes(this.hsConfig.get(this.app).social_hashtag)
            ? record.title + ' ' + this.hsConfig.get(this.app).social_hashtag
            : record.title,
        abstract: record.abstract,
      },
      this.app
    );
  }

  /**
   * Display composition info dialog
   * @param info - Composition info
   */
  infoDialogBootstrap(info): void {
    this.hsDialogContainerService.create(
      HsCompositionsInfoDialogComponent,
      {
        info,
      },
      this.app
    );
  }

  /**
   * Get composition common id
   * @param composition - Composition item
   */
  getCommonId(composition): string {
    return this.hsCompositionsService.commonId(composition);
  }
}
