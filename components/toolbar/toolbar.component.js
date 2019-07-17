export default {
    template: require('components/toolbar/partials/toolbar.html'),
    /**
     * @memberof hs.toolbar
     * @ngdoc controller
     * @name hs.toolbar.controller
     */
    controller: ['$scope', 'Core', '$timeout', function ($scope, Core, $timeout) {
        var collapsed = false;

        angular.extend($scope, {
            Core: Core,

            measureButtonClicked: function () {
                Core.setMainPanel('measure', true, false);
            },

            /**
             * Change/read collapsed setting
             * @memberof hs.toolbar.controller
             * @function collapsed
             * @param {boolean} is
             */
            collapsed: function (is) {
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
            isMobile: function () {
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
            compositionLoaded: function () {
                return angular.isDefined($scope.composition_title);
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