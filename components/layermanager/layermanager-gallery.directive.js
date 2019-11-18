export default ['config', 'hs.layout.service', 'hs.layermanager.service', function (config, layoutService, LayMan) {
    return {
        template: require('components/layermanager/partials/basemap-gallery.html'),

        controller: ['$scope', function ($scope) {
            $scope.LayMan = LayMan;
            $scope.galleryStyle = function () {
                if (!layoutService.sidebarRight || document.getElementById('hs-layout').clientWidth <= 767) {
                    return { right: '15px' }
                }
                else {
                    return { right: (layoutService.panelSpaceWidth() + 20) + 'px' }
                }

            };

            $scope.fitsInContainer = () => {
                return LayMan.data.baselayers.length * 120 < document.getElementById('hs-layout').clientWidth - layoutService.panelSpaceWidth() - 300;
            }
        }]
    };
}]