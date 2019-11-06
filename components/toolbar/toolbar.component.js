export default {
    template: require('components/toolbar/partials/toolbar.html'),
    /**
     * @memberof hs.toolbar
     * @ngdoc controller
     * @name hs.toolbar.controller
     */
    controller: ['$scope', 'Core', '$timeout', 'hs.layout.service',
        function ($scope, Core, $timeout, layoutService) {
            var collapsed = false;

            angular.extend($scope, {
                Core: Core,
                layoutService,
                
                measureButtonClicked() {
                    layoutService.setMainPanel('measure', true);
                },

                /**
                 * Change/read collapsed setting
                 * @memberof hs.toolbar.controller
                 * @function collapsed
                 * @param {boolean} is
                 */
                collapsed(is) {
                    if (arguments.length > 0) {
                        collapsed = is;
                    }
                    return collapsed;
                },

                /**
                 * Test mobile mode (document width under 800px)
                 * @memberof hs.toolbar.controller
                 * @function isMobile
                 */
                isMobile() {
                    if (document.body.innerWidth < 800) {
                        return "mobile";
                    } else {
                        return "";
                    }
                },

                /**
                 * True if composition is loaded
                 * @memberof hs.toolbar.controller
                 * @property compositionLoaded
                 */
                compositionLoaded() {
                    return angular.isDefined($scope.composition_title);
                },

                /**
                 * Dinamically generates style for placement of toolbar according 
                 * to panel size and position
                 * @memberof hs.toolbar.controller
                 * @function toolbarStyle
                 */
                toolbarStyle() {
                    if (!layoutService.sidebarRight)
                        return {
                            marginLeft: layoutService.panelSpaceWidth() + 'px',
                        }
                    else
                        return {
                            marginRight: layoutService.panelSpaceWidth() + 'px'
                        }
                }
            })


            $scope.$on('core.map_reset', function (event) {
                $timeout(function () {
                    delete $scope.composition_title;
                    delete $scope.composition_abstract;
                })
            });

            $scope.$emit('scope_loaded', "Toolbar");
        }]
}