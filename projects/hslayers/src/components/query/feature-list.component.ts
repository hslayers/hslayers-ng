import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Input} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {HsConfirmDialogComponent} from '../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsFeatureCommonService} from './feature-common.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsQueryVectorService} from './query-vector.service';
import {exportFormats} from './feature-common.service';
import {getTitle} from '../../common/layer-extensions';

@Component({
  selector: 'hs-query-feature-list',
  templateUrl: './partials/feature-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQueryFeatureListComponent {
  @Input() features;

  exportMenuVisible;
  selectedFeaturesVisible;
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
    return item.feature.ol_uid;
  }

  constructor(
    public HsQueryVectorService: HsQueryVectorService,
    public hsLanguageService: HsLanguageService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayoutService: HsLayoutService,
    public HsFeatureCommonService: HsFeatureCommonService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.selectedFeaturesVisible = this.HsLayoutService.mainpanel == 'info';
  }

  toggleEditMenu(): void {
    if (this.editType) {
      this.editType = null;
      return;
    }
    this.editMenuVisible = !this.editMenuVisible;
  }

  olFeatureArray(): Feature<Geometry>[] {
    return this.features.map((feature) => feature.feature);
  }

  toggleExportMenu(): void {
    this.HsFeatureCommonService.toggleExportMenu(
      this.exportFormats,
      this.olFeatureArray()
    );
    this.exportMenuVisible = !this.exportMenuVisible;
  }

  editTypeSelected(type: string): void {
    this.editType = type;
    this.editMenuVisible = !this.editMenuVisible;
  }

  moveOrCopyFeature(): void {
    this.HsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      this.olFeatureArray(),
      this.selectedLayer
    );
  }

  async removeAllSelectedFeatures(): Promise<void> {
    const dialog = this.HsDialogContainerService.create(
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
      for (const feature of this.features) {
        //Give HsQueryVectorService.featureRemovals time to splice QueryBase.data.features
        setTimeout(() => {
          this.HsQueryVectorService.removeFeature(feature.feature);
        }, 250);
      }
    }
  }
}
