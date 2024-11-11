import {AsyncPipe, NgClass, NgStyle, SlicePipe} from '@angular/common';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {Feature, getUid} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsFeatureCommonService} from '../feature-common.service';
import {HsQueryBaseService} from 'hslayers-ng/services/query';
import {HsQueryFeatureComponent} from '../feature/feature.component';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {exportFormats} from '../feature-common.service';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-query-feature-list',
  templateUrl: './feature-list.component.html',
  standalone: true,
  imports: [
    TranslateCustomPipe,
    AsyncPipe,
    FormsModule,
    NgbDropdownModule,
    HsDownloadModule,
    NgClass,
    NgStyle,
    HsQueryFeatureComponent,
    SlicePipe,
  ],
})
export class HsQueryFeatureListComponent {
  exportMenuVisible;
  selectedFeaturesVisible = true;
  exportFormats: exportFormats[] = [
    {name: 'WKT', ext: 'wkt', mimeType: 'text/plain', downloadData: ''},
    {
      name: 'GeoJSON',
      ext: 'geojson',
      mimeType: 'application/json',
      downloadData: '',
    },
  ];
  editType = null;
  editMenuVisible = false;
  selectedLayer = null;
  getTitle = getTitle;

  constructor(
    private hsQueryVectorService: HsQueryVectorService,
    private hsDialogContainerService: HsDialogContainerService,
    public hsFeatureCommonService: HsFeatureCommonService,
    public hsQueryBaseService: HsQueryBaseService,
  ) {}

  /**
   * Track item by OpenLayers feature, ol_uid value
   * @param index - Index
   * @param item - Item provided
   */
  trackById(index, item) {
    if (item.feature) {
      return getUid(item.feature);
    } else {
      return JSON.stringify(item);
    }
  }

  /**
   * Get OL feature array
   * @returns Feature array
   */
  olFeatureArray(): Feature<Geometry>[] {
    return this.hsQueryBaseService.features
      .map((feature) => feature.feature)
      .filter((f) => f);
  }

  /**
   * Toggle dropdown menus
   * @param beingToggled - Menu name that is being toggled
   * @param other - Other menu name to be closed if opened
   */
  toggleMenus(beingToggled: string, other: string): void {
    this[other] = this[other] ? !this[other] : this[other];
    this[beingToggled] = !this[beingToggled];
  }

  /**
   * Toggle export menu
   */
  toggleExportMenu(): void {
    this.hsFeatureCommonService.toggleExportMenu(
      this.exportFormats,
      this.olFeatureArray(),
    );
    this.toggleMenus('exportMenuVisible', 'editMenuVisible');
  }

  /**
   * Toggle edit menu
   */
  toggleEditMenu(): void {
    if (this.editType) {
      this.editType = null;
      return;
    }
    this.toggleMenus('editMenuVisible', 'exportMenuVisible');
  }

  /**
   * Set edit type
   * @param type - Type selected
   */
  editTypeSelected(type: string): void {
    this.editType = type;
    this.editMenuVisible = !this.editMenuVisible;
  }

  /**
   * Move or copy feature
   */
  moveOrCopyFeature(): void {
    this.hsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      this.olFeatureArray(),
      this.selectedLayer,
    );
  }

  /**
   * Remove all selected features
   */
  async removeAllSelectedFeatures(): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'QUERY.reallyDeleteAllSelectedLayers',
        title: 'COMMON.confirmDelete',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      for (const feature of this.hsQueryBaseService.features.filter((f) =>
        this.hsQueryVectorService.isFeatureRemovable(f.feature),
      )) {
        //Give HsQueryVectorService.featureRemovals time to splice QueryBase.data.features
        setTimeout(() => {
          this.hsQueryVectorService.removeFeature(feature.feature);
        }, 250);
      }
    }
  }

  /**
   * Translate string value to the selected UI language
   * @param module - Locales json key
   * @param text - Locales json key value
   * @returns Translated text
   */
  translateString(module: string, text: string): string {
    return this.hsFeatureCommonService.translateString(module, text);
  }
}
