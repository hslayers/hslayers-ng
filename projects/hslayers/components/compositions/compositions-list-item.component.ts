import {Component, Input, inject} from '@angular/core';

import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsSetPermissionsDialogComponent} from 'hslayers-ng/common/dialog-set-permissions';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';

@Component({
  selector: 'hs-compositions-list-item',
  templateUrl: 'compositions-list-item.component.html',
  standalone: false,
})
export class HsCompositionsListItemComponent {
  private hsCompositionsService = inject(HsCompositionsService);
  private hsToastService = inject(HsToastService);
  private hsDialogContainerService = inject(HsDialogContainerService);
  private hsConfig = inject(HsConfig);
  private hsLanguageService = inject(HsLanguageService);
  private hsCompositionsCatalogueService = inject(
    HsCompositionsCatalogueService,
  );
  hsCommonLaymanService = inject(HsCommonLaymanService);

  @Input() composition: HsMapCompositionDescriptor;
  @Input() selectedCompId: string;

  /**
   * Load selected composition
   * @param composition - Selected composition
   */
  openComposition(composition: HsMapCompositionDescriptor): void {
    this.hsCompositionsService.loadCompositionParser(composition);
  }
  /**
   * @param record - Composition to show details
   * Load info about composition through service and display composition info dialog
   */
  async detailComposition(record: HsMapCompositionDescriptor): Promise<void> {
    const info = await this.hsCompositionsService.getCompositionInfo(record);
    if (info !== undefined) {
      this.infoDialogBootstrap(info);
    }
  }

  /**
   * @param record - Composition to share
   * Prepare share object on server and display share dialog to share composition
   */
  async shareComposition(record: HsMapCompositionDescriptor): Promise<void> {
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
          'COMPOSITIONS.errorWhileSharingOnSocialNetwork',
          undefined,
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.message,
          {url: url},
        ),
        {disableLocalization: true},
      );
    }
  }

  /**
   * Show permissions dialog window for selected composition.
   * @param composition - Selected composition
   */
  async showPermissions(
    composition: HsMapCompositionDescriptor,
  ): Promise<void> {
    this.hsDialogContainerService.create(HsSetPermissionsDialogComponent, {
      recordType: 'composition',
      selectedRecord: composition,
      onPermissionSaved: {
        service: this.hsCompositionsCatalogueService,
        method: 'loadFilteredCompositions',
      },
    });
  }

  /**
   * @param composition - Composition selected for deletion
   * Display delete dialog of composition
   */
  confirmDelete(composition: HsMapCompositionDescriptor): void {
    if (!composition.editable) {
      return;
    }
    this.deleteDialogBootstrap(composition);
  }

  /**
   * @param composition - Composition selected for deletion
   */
  deleteDialogBootstrap(composition): void {
    this.hsDialogContainerService.create(HsCompositionsDeleteDialogComponent, {
      compositionToDelete: composition,
    });
  }

  /**
   * @param record - Composition selected for sharing
   */
  shareDialogBootstrap(record: HsMapCompositionDescriptor, url: string): void {
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

  /**
   * Display composition info dialog
   * @param info - Composition info
   */
  async infoDialogBootstrap(info): Promise<void> {
    const {HsCompositionsInfoDialogComponent} = await import(
      './dialogs/info-dialog.component'
    );
    this.hsDialogContainerService.create(HsCompositionsInfoDialogComponent, {
      info,
    });
  }

  /**
   * Get composition common id
   * @param composition - Composition item
   */
  getCommonId(composition: HsMapCompositionDescriptor): string {
    return this.hsCompositionsService.commonId(composition);
  }
}
