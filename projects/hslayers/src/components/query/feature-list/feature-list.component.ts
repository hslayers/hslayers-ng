import {Component} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfirmDialogComponent} from '../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsFeatureCommonService} from '../feature-common.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsQueryBaseService} from '../query-base.service';
import {HsQueryVectorService} from '../query-vector.service';
import {exportFormats} from '../feature-common.service';
import {getTitle} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-query-feature-list',
  templateUrl: './feature-list.component.html',
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

  trackById(index, item) {
    if (item.feature) {
      return item.feature.ol_uid;
    } else {
      return JSON.stringify(item);
    }
  }

  constructor(
    public hsQueryVectorService: HsQueryVectorService,
    public hsLanguageService: HsLanguageService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLayoutService: HsLayoutService,
    public hsFeatureCommonService: HsFeatureCommonService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsQueryBaseService: HsQueryBaseService
  ) {}

  olFeatureArray(): Feature<Geometry>[] {
    return this.hsQueryBaseService.data.features
      .map((feature) => feature.feature)
      .filter((f) => f);
  }

  /**
   * Toggle dropdown menus
   * @param beingToggled - Menu being toggled
   * @param other - Other menu to be closed if opened
   */
  toggleMenus(beingToggled: string, other: string): void {
    this[other] = this[other] ? !this[other] : this[other];
    this[beingToggled] = !this[beingToggled];
  }

  toggleExportMenu(): void {
    this.hsFeatureCommonService.toggleExportMenu(
      this.exportFormats,
      this.olFeatureArray()
    );
    this.toggleMenus('exportMenuVisible', 'editMenuVisible');
  }

  toggleEditMenu(): void {
    if (this.editType) {
      this.editType = null;
      return;
    }
    this.toggleMenus('editMenuVisible', 'exportMenuVisible');
  }

  editTypeSelected(type: string): void {
    this.editType = type;
    this.editMenuVisible = !this.editMenuVisible;
  }

  moveOrCopyFeature(): void {
    this.hsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      this.olFeatureArray(),
      this.selectedLayer
    );
  }

  async removeAllSelectedFeatures(): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'QUERY.reallyDeleteAllSelectedLayers'
        ),
        title: this.hsLanguageService.getTranslation('COMMON.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      for (const feature of this.hsQueryBaseService.data.features) {
        //Give HsQueryVectorService.featureRemovals time to splice QueryBase.data.features
        setTimeout(() => {
          this.hsQueryVectorService.removeFeature(feature.feature);
        }, 250);
      }
    }
  }
}
