import {Component} from '@angular/core';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from './query-vector.service';
import {Input} from '@angular/core';

@Component({
  selector: 'hs-query-feature',
  templateUrl: './partials/feature.html',
})
export class HsQueryFeatureComponent {
  @Input() feature;
  attributeName = '';
  attributeValue = '';
  newAttribVisible = false;
  exportFormats = [{name: 'WKT format'}];
  constructor(
    public HsMapService: HsMapService,
    public HsQueryVectorService: HsQueryVectorService
  ) {}

  olFeature() {
    return this.feature.feature;
  }

  isFeatureRemovable() {
    if (this.feature.feature) {
      return this.HsQueryVectorService.isFeatureRemovable(this.olFeature());
    } else {
      return false;
    }
  }

  saveNewAttribute(attributeName, attributeValue) {
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

  removeFeature() {
    this.HsQueryVectorService.removeFeature(this.olFeature());
  }

  zoomToFeature() {
    const extent = this.olFeature().getGeometry().getExtent();
    this.HsMapService.map
      .getView()
      .fit(extent, this.HsMapService.map.getSize());
  }
}
