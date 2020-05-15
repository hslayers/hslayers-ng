export default {
  template: require('./partials/toolbar.html'),
  controller: function ($scope, HsCore, $timeout, HsLayoutService, $document) {
    'ngInject';
    let collapsed = false;

    angular.extend($scope, {
      HsCore: HsCore,
      layoutService: HsLayoutService,

      measureButtonClicked() {
        HsLayoutService.setMainPanel('measure', true);
      },

      /**
       * Change/read collapsed setting
       *
       * @memberof hs.toolbar.controller
       * @function collapsed
       * @returns {boolean} Collapsed state
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
       *
       * @memberof hs.toolbar.controller
       * @returns {string} Returns if mobile layout should be used (document body less than 800px)
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
       *
       * @memberof hs.toolbar.controller
       * @function compositionLoaded
       * @returns {boolean} Returns if composition_title is set and thus composition is loaded. TODO rename
       */
      compositionLoaded() {
        return angular.isDefined($scope.composition_title);
      },

      /**
       * Dinamically generates style for placement of toolbar according
       * to panel size and position
       *
       * @memberof hs.toolbar.controller
       * @function toolbarStyle
       * @returns {object} Dinamicaly generated CSS style
       */
      toolbarStyle() {
        if (!HsLayoutService.sidebarBottom()) {
          if (!HsLayoutService.sidebarRight) {
            return {
              marginLeft: HsLayoutService.panelSpaceWidth() + 'px',
            };
          } else {
            return {
              marginRight: HsLayoutService.panelSpaceWidth() + 'px',
            };
          }
        }
      },
    });

    $scope.$on('core.map_reset', (event) => {
      $timeout(() => {
        delete $scope.composition_title;
        delete $scope.composition_abstract;
      });
    });

    $scope.$emit('scope_loaded', 'Toolbar');
  },
};
