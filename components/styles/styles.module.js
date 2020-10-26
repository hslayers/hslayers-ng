import stylerColorDirective from './styler-color.directive';
import stylerComponent from './styler.component';
import {HsStylerService} from './styles.service';

/**
 * @namespace hs.styles
 * @memberOf hs
 */
angular
  .module('hs.styles', ['hs.map'])
  /**
   * DEPRECATED?
   * @memberof hs.styles
   * @ngdoc service
   * @name HsStylesService
   * @description Service with definition of basic styles used througout HS-LayersNG
   */
  .factory('HsStylesService', HsStylerService)

  /**
   * @memberof hs.styles
   * @ngdoc directive
   * @name hs.styler.directive
   * @description Display styling menu for layer
   */
  .directive('hs.styler.directive', [
    'HsConfig',
    function (config) {
      return {};
    },
  ])

  /**
   * @memberof hs.styles
   * @ngdoc directive
   * @name hs.styler.colorDirective
   * @description Display color selector for styling menu
   */
  .directive('hs.styler.colorDirective', stylerColorDirective)

  /**
   * @memberof hs.styles
   * @ngdoc service
   * @name HsStylerService
   * @description Contain current styled layer
   */
  .factory('HsStylerService', [
    function () {
      this.layer = null;
      return this;
    },
  ])

  /**
   * @memberof hs.styler
   * @ngdoc component
   * @name hs.styler
   */
  .component('hs.styler', stylerComponent);
