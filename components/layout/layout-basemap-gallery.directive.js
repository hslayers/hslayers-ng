export default ['config', 'hs.layout.service','hs.layermanager.service', function (config, layoutService,LayMan) {
    return {
        template: require('components/layout/partials/basemap-gallery.html'),

        controller: ['$scope', function ($scope) {  
            $scope.LayMan = LayMan;                              
            $scope.galleryStyle = function (){
                if (!layoutService.sidebarRight){
                    return {right: '15px' }
                }
                else {
                    return {right: (layoutService.panelSpaceWidth() + 20) + 'px'}
                }
     
            };
        }]
    };
}]