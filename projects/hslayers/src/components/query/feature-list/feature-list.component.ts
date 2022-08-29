import {Component, Input, OnInit} from '@angular/core';

import {Feature, getUid} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfirmDialogComponent} from '../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsFeatureCommonService} from '../feature-common.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsQueryBaseService} from '../query-base.service';
import {HsQueryVectorService} from '../query-vector.service';
import {exportFormats} from '../feature-common.service';
import {getTitle} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-query-feature-list',
  templateUrl: './feature-list.component.html',
})
export class HsQueryFeatureListComponent implements OnInit {
  @Input() app = 'default';
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
  queryBaseAppRef;
  featureCommonAppRef;
  getTitle = getTitle;

  /**
   * Track item by openlayers feature, ol_uid value
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

  constructor(
    private hsQueryVectorService: HsQueryVectorService,
    private hsLanguageService: HsLanguageService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsFeatureCommonService: HsFeatureCommonService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsQueryBaseService: HsQueryBaseService
  ) {}

  ngOnInit(): void {
    this.queryBaseAppRef = this.hsQueryBaseService.get(this.app);
    this.hsFeatureCommonService.init(this.app);
    this.featureCommonAppRef = this.hsFeatureCommonService.apps[this.app];
  }

  /**
   * Get OL feature array
   * @returns Feature array
   */
  olFeatureArray(): Feature<Geometry>[] {
    return this.queryBaseAppRef.features
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
   * @param app - App identifier
   */
  toggleExportMenu(app: string): void {
    this.hsFeatureCommonService.toggleExportMenu(
      this.exportFormats,
      this.olFeatureArray(),
      app
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
   * @param app - App identifier
   */
  moveOrCopyFeature(app: string): void {
    this.hsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      this.olFeatureArray(),
      this.selectedLayer,
      app
    );
  }

  /**
   * Remove all selected features
   * @param app - App identifier
   */
  async removeAllSelectedFeatures(app: string): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'QUERY.reallyDeleteAllSelectedLayers',
          undefined,
          this.app
        ),
        title: this.hsLanguageService.getTranslation(
          'COMMON.confirmDelete',
          undefined,
          this.app
        ),
      },
      this.app
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      for (const feature of this.queryBaseAppRef.features) {
        //Give HsQueryVectorService.featureRemovals time to splice QueryBase.data.features
        setTimeout(() => {
          this.hsQueryVectorService.removeFeature(feature.feature, app);
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
    return this.hsFeatureCommonService.translateString(module, text, this.app);
  }
}
