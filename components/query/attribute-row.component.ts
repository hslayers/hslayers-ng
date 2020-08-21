import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs.query.attributeRow',
  template: require('./partials/attribute-row.html'),
})
export class HsQueryAttributeRowComponent {
  @Input() attribute;
  @Input() feature;
  @Input() readonly;
  @Input() template;

  change() {
    if ($scope.$ctrl.feature && $scope.$ctrl.feature.feature) {
      const feature = $scope.$ctrl.feature.feature;
      feature.set($scope.$ctrl.attribute.name, $scope.$ctrl.attribute.value);
    }
  }
}
