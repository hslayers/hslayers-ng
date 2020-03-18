export default {
  template: require('./partials/toolbar.html'),
  controller: ['$scope', 'Core', '$timeout', 'hs.layout.service', '$document',
    function ($scope, Core, $timeout, layoutService, $document) {
      let collapsed = false;

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
         * @returns {Boolean} Collapsed state
         * @param {boolean} is Value to set collapsed state to
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
         * @returns {String} Returns if mobile layout should be used (document body less than 800px)
         * @function isMobile
         */
        isMobile() {
          if ($document[0].body.innerWidth < 800) {
            return 'mobile';
          } else {
            return '';
          }
        },

        /**
         * True if composition is loaded
         * @memberof hs.toolbar.controller
         * @function compositionLoaded
         * @returns {Boolean} Returns if composition_title is set and thus composition is loaded. TODO rename
         */
        compositionLoaded() {
          return angular.isDefined($scope.composition_title);
        },

        /**
         * Dinamically generates style for placement of toolbar according
         * to panel size and position
         * @memberof hs.toolbar.controller
         * @function toolbarStyle
         * @return {Object} Dinamicaly generated CSS style
         */
        toolbarStyle() {
          if (!layoutService.sidebarBottom()) {
            if (!layoutService.sidebarRight) {
              return {
                marginLeft: layoutService.panelSpaceWidth() + 'px'
              };
            } else {
              return {
                marginRight: layoutService.panelSpaceWidth() + 'px'
              };
            }
          }
        }
      });


      $scope.$on('core.map_reset', (event) => {
        $timeout(() => {
          delete $scope.composition_title;
          delete $scope.composition_abstract;
        });
      });

      $scope.$emit('scope_loaded', 'Toolbar');
    }]
};
