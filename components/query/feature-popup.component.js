import Overlay from 'ol/Overlay';
import { getChangeEventType } from 'ol/Object';
import { Feature } from 'ol';
export default {
    template: require('./partials/feature-popup.html'),
    controller: ['$scope', 'hs.query.baseService', 'hs.map.service', 'hs.query.vectorService', '$element', '$timeout', function ($scope, queryBaseService, hsMap, vectorService, $element, $timeout) {
        angular.extend($scope, {
            queryBaseService,
            vectorService,
            popupVisible() {
                return {
                    'visibility': (queryBaseService.featuresUnderMouse.length > 0 ? 'visible' : 'hidden')
                }
            },
            isClustered(feature) {
                return feature.get('features') && feature.get('features').length > 0;
            },
            serializeFeatureName(feature) {
                if (feature.get('name')) return feature.get('name');
                if (feature.get('title')) return feature.get('title');
                if (feature.get('label')) return feature.get('label');
            }
        });
        var hoverPopupElement = $element[0];
        queryBaseService.hoverPopup = new Overlay({
            element: hoverPopupElement
        });
        hsMap.map.addOverlay(queryBaseService.hoverPopup);
    }]
};
