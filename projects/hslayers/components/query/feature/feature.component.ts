import {Component, DestroyRef, Input, OnInit} from '@angular/core';
import {Observable, map} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';

import {AsyncPipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsFeatureCommonService} from '../feature-common.service';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueryAttributeRowComponent} from '../attribute-row/attribute-row.component';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {exportFormats} from '../feature-common.service';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-query-feature',
  templateUrl: './feature.component.html',
  standalone: true,
  imports: [
    TranslateCustomPipe,
    AsyncPipe,
    FormsModule,
    NgbDropdownModule,
    HsDownloadModule,
    NgClass,
    HsQueryAttributeRowComponent,
  ],
})
export class HsQueryFeatureComponent implements OnInit {
  @Input() feature;

  attributeName = '';
  attributeValue = '';
  newAttribVisible = false;
  exportFormats: exportFormats[] = [
    {name: 'WKT', ext: 'wkt', mimeType: 'text/plain', downloadData: ''},
    {
      name: 'GeoJSON',
      ext: 'geojson',
      mimeType: 'application/json',
      downloadData: '',
    },
  ];
  exportMenuVisible = false;
  editMenuVisible = false;
  selectedLayer = null;
  editType: 'move' | 'copy';
  getTitle = getTitle;
  availableLayers: Observable<Layer[]>;

  readonly: boolean;

  constructor(
    private hsMapService: HsMapService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsFeatureCommonService: HsFeatureCommonService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private DestroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.availableLayers = this.hsFeatureCommonService.availableLayer$.pipe(
      takeUntilDestroyed(this.DestroyRef),
      map((layers) => {
        if (!this.olFeature()) {
          //Feature from WMS getFeatureInfo
          return [];
        }
        const featureLayer = this.hsMapService.getLayerForFeature(
          this.olFeature(),
        );
        this.readonly = !this.hsLayerUtilsService.isLayerEditable(featureLayer);
        return layers.filter((layer) => layer != featureLayer);
      }),
    );
  }

  /**
   * Get OL feature
   * @returns Returns feature
   */
  olFeature(): Feature<Geometry> {
    return this.feature?.feature;
  }

  /**
   * Check if this feature is removable
   * @returns True if the feature can be removed from the map, false otherwise
   */
  isFeatureRemovable(): boolean {
    return this.olFeature()
      ? this.hsQueryVectorService.isFeatureRemovable(this.olFeature())
      : false;
  }

  /**
   * Set new feature attribute
   * @param attributeName - New attribute name
   * @param attributeValue - New attribute value
   */
  saveNewAttribute(attributeName: string, attributeValue): void {
    if (this.feature?.feature) {
      const feature = this.feature.feature;
      const getDuplicates = this.feature.attributes.filter(
        (duplicate) => duplicate.name == attributeName,
      );
      if (getDuplicates.length == 0) {
        const obj = {name: attributeName, value: attributeValue};
        this.feature.attributes.push(obj);
        feature.set(attributeName, attributeValue);
      }
    }
    this.newAttribVisible = !this.newAttribVisible;
    this.attributeName = '';
    this.attributeValue = '';
  }

  /**
   * Remove this feature
   */
  removeFeature(): void {
    this.hsQueryVectorService.removeFeature(this.olFeature());
  }

  /**
   * Zoom to this feature
   */
  zoomToFeature(): void {
    const extent = this.olFeature().getGeometry().getExtent();
    this.hsMapService.fitExtent(extent);
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
   * Toggle export menus
   */
  toggleExportMenu(): void {
    this.hsFeatureCommonService.toggleExportMenu(
      this.exportFormats,
      this.olFeature(),
    );
    this.toggleMenus('exportMenuVisible', 'editMenuVisible');
  }

  /**
   * Set edit type (move or copy)
   * @param type - Type selected
   */
  editTypeSelected(type: 'move' | 'copy'): void {
    this.editType = type;
    this.editMenuVisible = !this.editMenuVisible;
  }

  /**
   * Show or hide edit menu
   */
  toggleEditMenu(): void {
    if (this.editType) {
      this.editType = null;
      return;
    }
    this.toggleMenus('editMenuVisible', 'exportMenuVisible');
  }

  /**
   * Move or copy feature
   */
  moveOrCopyFeature(): void {
    this.hsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      [this.olFeature()],
      this.selectedLayer,
    );
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
