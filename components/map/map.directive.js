/**
 * @param HsMapService
 * @param $timeout
 * @param HsLayoutService
 */
export default function (HsMapService, $timeout, HsLayoutService) {
  'ngInject';
  return {
    template: require('./partials/map.html'),
    link: function (scope, element, attrs, ctrl) {
      let previousCenter = null;
      let previousZoom = null;
      if (HsMapService.map) {
        previousCenter = HsMapService.map.getView().getCenter();
        previousZoom = HsMapService.map.getView().getZoom();
        delete HsMapService.map;
      }
      $timeout(() => {
        HsMapService.mapElement = element[0];
        const el = HsLayoutService.contentWrapper.querySelector(
          '.ol-zoomslider'
        );
        if (el) {
          el[0].style.width = 28 + 'px';
          el[0].style.height = 200 + 'px';
        }
        scope.init();
        if (previousCenter) {
          HsMapService.map.getView().setCenter(previousCenter);
        }
        if (previousZoom) {
          HsMapService.map.getView().setZoom(previousZoom);
        }
      }, 0);
    },
  };
}
