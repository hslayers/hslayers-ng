export default ['config', '$sce', function (config, $sce) {
  return {
    template: require('./partials/layer-static-directive.html'),
    scope: {
      layer: '<'
    },
    link(scope, element) {
      function fillContent() {
        const legendImage = scope.layer.lyr.get('legendImage');
        if (legendImage) {
          if (legendImage.indexOf('<svg') > -1) {
            scope.legendType = 'svg';
            scope.svgContent = $sce.trustAsHtml(legendImage);
          } else {
            scope.legendType = 'image';
            scope.legendImage = legendImage;
          }
        }
      }
      if (angular.isDefined(scope.layer.lyr.get('legendImage'))) {
        fillContent();
      } else {
        scope.$watch(() => {
          return scope.layer.lyr.get('legendImage');
        }, () => {
          fillContent();
        });
      }
    }
  };
}];
