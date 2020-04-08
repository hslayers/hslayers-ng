export default [
  'config',
  'hs.map.service',
  '$timeout',
  'hs.layout.service',
  function (config, service, $timeout, layoutService) {
    return {
      template: require('./partials/map.html'),
      link: function (scope, element, attrs, ctrl) {
        let previousCenter = null;
        let previousZoom = null;
        if (service.map) {
          previousCenter = service.map.getView().getCenter();
          previousZoom = service.map.getView().getZoom();
          delete service.map;
        }
        $timeout(() => {
          service.mapElement = element[0];
          const el = layoutService.contentWrapper.querySelector(
            '.ol-zoomslider'
          );
          if (el) {
            el[0].style.width = 28 + 'px';
            el[0].style.height = 200 + 'px';
          }
          scope.init();
          if (previousCenter) {
            service.map.getView().setCenter(previousCenter);
          }
          if (previousZoom) {
            service.map.getView().setZoom(previousZoom);
          }
        }, 0);
      },
    };
  },
];
