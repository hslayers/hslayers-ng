import {Component} from '@angular/core';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from './query-vector.service';
import {Input} from '@angular/core';

@Component({
  selector: 'hs.query.feature',
  template: require('./partials/feature.html'),
})
export class HsQueryFeatureComponent {
  @Input() feature;
  attributeName = '';
  attributeValue = '';
  newAttribVisible = false;
  exportFormats = [{name: 'WKT format'}];
  constructor(
    private HsMapService: HsMapService,
    private HsQueryVectorService: HsQueryVectorService
  ) {}

  olFeature() {
    return $scope.$ctrl.feature.feature;
  }

  isFeatureRemovable() {
    if (angular.isDefined($scope.$ctrl.feature.feature)) {
      return HsQueryVectorService.isFeatureRemovable(olFeature());
    } else {
      return false;
    }
  }

  saveNewAttribute(attributeName, attributeValue) {
    if ($scope.$ctrl.feature && $scope.$ctrl.feature.feature) {
      const feature = $scope.$ctrl.feature.feature;
      const getDuplicates = $scope.$ctrl.feature.attributes.filter(
        (duplicate) => duplicate.name == attributeName
      );
      if (getDuplicates.length == 0) {
        const obj = {name: attributeName, value: attributeValue};
        $scope.$ctrl.feature.attributes.push(obj);
        feature.set(attributeName, attributeValue);
      }
    }
    $scope.$ctrl.newAttribVisible = !$scope.$ctrl.newAttribVisible;
    $scope.$ctrl.attributeName = '';
    $scope.$ctrl.attributeValue = '';
  }

  removeFeature() {
    HsQueryVectorService.removeFeature(olFeature());
    $scope.$emit('infopanel.featureRemoved', olFeature());
  }

  zoomToFeature() {
    const extent = olFeature().getGeometry().getExtent();
    HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
  }
}
