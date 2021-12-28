import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import {Input, OnDestroy} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsFeatureCommonService} from '../feature-common.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsMapService} from '../../map/map.service';
import {HsQueryVectorService} from '../query-vector.service';
import {exportFormats} from '../feature-common.service';
import {getTitle} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-query-feature',
  templateUrl: './feature.component.html'
})
export class HsQueryFeatureComponent implements OnDestroy {
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
  editType: string;
  getTitle = getTitle;
  availableLayers = [];
  availableLayersSubscription: any;

  constructor(
    public hsMapService: HsMapService,
    public hsQueryVectorService: HsQueryVectorService,
    public hsFeatureCommonService: HsFeatureCommonService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public cd: ChangeDetectorRef
  ) {
    this.availableLayersSubscription =
    this.hsFeatureCommonService.availableLayer$.subscribe((layers) => {
      if (!this.olFeature()) {
        //Feature from WMS getFeatureInfo
        return;
      }
      const featureLayer = this.hsMapService.getLayerForFeature(this.olFeature());
      this.availableLayers = layers.filter((layer) => layer != featureLayer);
    });
  }

  ngOnDestroy(): void {
    this.availableLayersSubscription?.unsubscribe();
  }

  olFeature(): Feature<Geometry> {
    return this.feature?.feature;
  }

  isFeatureRemovable(): boolean {
    return this.olFeature()
      ? this.hsQueryVectorService.isFeatureRemovable(this.olFeature())
      : false;
  }

  saveNewAttribute(attributeName, attributeValue): void {
    if (this.feature?.feature) {
      const feature = this.feature.feature;
      const getDuplicates = this.feature.attributes.filter(
        (duplicate) => duplicate.name == attributeName
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

  removeFeature(): void {
    this.hsQueryVectorService.removeFeature(this.olFeature());
  }

  zoomToFeature(): void {
    const extent = this.olFeature().getGeometry().getExtent();
    this.hsMapService.fitExtent(extent);
  }

  /**
   * Toggle dropdown menus
   * @param beingToggled Menu being toggled
   * @param other Other menu to be closed if opened
   */
  toggleMenus(beingToggled: string, other: string): void {
    this[other] = this[other] ? !this[other] : this[other];
    this[beingToggled] = !this[beingToggled];
  }

  toggleExportMenu(): void {
    this.hsFeatureCommonService.toggleExportMenu(
      this.exportFormats,
      this.olFeature()
    );
    this.toggleMenus('exportMenuVisible', 'editMenuVisible');
  }

  editTypeSelected(type): void {
    this.editType = type;
    this.editMenuVisible = !this.editMenuVisible;
  }

  toggleEditMenu(): void {
    if (this.editType) {
      this.editType = null;
      return;
    }
    this.toggleMenus('editMenuVisible', 'exportMenuVisible');
  }

  moveOrCopyFeature(): void {
    this.hsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      [this.olFeature()],
      this.selectedLayer
    );
  }
}
