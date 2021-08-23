import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Input} from '@angular/core';

import {HsConfirmDialogComponent} from '../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsQueryVectorService} from './query-vector.service';

@Component({
  selector: 'hs-query-feature-list',
  templateUrl: './partials/feature-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQueryFeatureListComponent {
  @Input() features;

  exportMenuVisible;
  selectedFeaturesVisible;
  exportFormats: {
    name: 'WKT' | 'GeoJSON';
    ext: string;
    serializedData?: string;
    mimeType: string;
    downloadData?: any;
  }[] = [
    {name: 'WKT', ext: 'wkt', mimeType: 'text/plain', downloadData: ''},
    {
      name: 'GeoJSON',
      ext: 'geojson',
      mimeType: 'application/json',
      downloadData: '',
    },
  ];

  trackById(index, item){
    return item.feature.ol_uid;
  }

  constructor(
    public HsQueryVectorService: HsQueryVectorService,
    public hsLanguageService: HsLanguageService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayoutService: HsLayoutService
  ) {
    this.selectedFeaturesVisible = this.HsLayoutService.mainpanel == 'info';
  }

  toggleExportMenu(): void {
    for (const format of this.exportFormats) {
      format.serializedData = this.HsQueryVectorService.exportData(
        format.name,
        this.features.map((feature) => feature.feature)
      );
    }
    this.exportMenuVisible = !this.exportMenuVisible;
  }

  async removeAllSelectedFeatures() {
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
