import Overlay from 'ol/Overlay';
export default {
    template: require('./partials/feature-popup.html'),
    controller: ['$scope', 'hs.query.baseService', 'hs.map.service', 'hs.query.vectorService', '$element', function ($scope, queryBaseService, hsMap, vectorService, $element) {
        angular.extend($scope, {
            queryBaseService,
            popupVisible() {
                return { 
                    'visibility': (queryBaseService.featuresUnderMouse.length > 0 ? 'visible' : 'hidden') 
                }
            }
        });
        var hoverPopupElement = $element[0];
        queryBaseService.hoverPopup = new Overlay({
            element: hoverPopupElement
        });
        hsMap.map.addOverlay(queryBaseService.hoverPopup);
    }]
};
