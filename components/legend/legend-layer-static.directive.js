export default ['config', '$sce', function (config, $sce) {
    return {
        template: require('components/legend/partials/layer-static-directive.html'),
        scope: {
            layer: '<'
        },
        link(scope, element) {
            function fillContent(){
                const legendImage = scope.layer.lyr.get('legendImage');
                if(legendImage){
                    if (legendImage.indexOf('<svg') > -1) {
                        scope.legendType = 'svg';
                        scope.svgContent = $sce.trustAsHtml(legendImage);
                    }
                }
            }
            if (angular.isDefined(scope.layer.lyr.get('legendImage'))) {
                fillContent();
            } else {
                scope.$watch(function(){
                    return scope.layer.lyr.get('legendImage')
                }, function () {
                    fillContent()
                });
            }
        }
    };
}]