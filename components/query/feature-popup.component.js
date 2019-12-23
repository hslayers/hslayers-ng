export default {
    template: require('./partials/feature-popup.html'),
    controller: ['$scope', 'hs.query.baseService', 'hs.map.service', 'hs.query.vectorService', '$element', function ($scope, queryBaseService, OlMap, vectorService, $element) {
        angular.extend($scope, {
            queryBaseService,         
        });
        queryBaseService.hoverPopupElement = $element[0].querySelector('.ol-popup');
    }]
};
