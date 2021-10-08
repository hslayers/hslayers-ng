import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import {Input} from '@angular/core';

import {HsFeatureCommonService} from './feature-common.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from './query-vector.service';
import {exportFormats} from './feature-common.service';
import {getTitle} from '../../common/layer-extensions';
import {Geometry} from 'ol/geom';
import {Feature} from 'ol';

@Component({
  selector: 'hs-query-feature',
  templateUrl: './partials/feature.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQueryFeatureComponent implements AfterViewInit {
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
  availableLayers;
  availableLayersSubscription: any;

  constructor(
    public HsMapService: HsMapService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsFeatureCommonService: HsFeatureCommonService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    const featureLayer = this.HsMapService.getLayerForFeature(this.olFeature());
    this.availableLayersSubscription =
      this.HsFeatureCommonService.availableLayer$.subscribe((layers) => {
        this.availableLayers = layers.filter((layer) => layer != featureLayer);
        this.cd.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.availableLayersSubscription.unsubscribe();
  }

  olFeature(): Feature<Geometry> {
    return this.feature.feature;
  }

  isFeatureRemovable(): boolean {
    return this.olFeature()
      ? this.HsQueryVectorService.isFeatureRemovable(this.olFeature())
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
    this.HsQueryVectorService.removeFeature(this.olFeature());
  }

  zoomToFeature(): void {
    const extent = this.olFeature().getGeometry().getExtent();
    this.HsMapService.fitExtent(extent);
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
    this.HsFeatureCommonService.toggleExportMenu(
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
    this.HsFeatureCommonService.moveOrCopyFeature(
      this.editType,
      [this.olFeature()],
      this.selectedLayer
    );
  }
}
