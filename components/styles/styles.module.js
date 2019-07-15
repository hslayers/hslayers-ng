import stylesService from './styles.service';
import stylerColorDirective from './styler-color.directive';
import stylerComponent from './styler.component';

/**
 * @namespace hs.styles
 * @memberOf hs
 */
angular.module('hs.styles', ['hs.map'])
    /**
    * DEPRECATED?
    * @memberof hs.styles
    * @ngdoc service
    * @name hs.styles.service
    * @description Service with definition of basic styles used througout HS-LayersNG
    */
    .service("hs.styles.service", stylesService)

    /**
    * @memberof hs.styles
    * @ngdoc directive
    * @name hs.styler.directive
    * @description Display styling menu for layer
    */
    .directive('hs.styler.directive', ['config', function (config) {
        return {
            
        };
    }])

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
    * @name hs.styler.service
    * @description Contain current styled layer
    */
    .service("hs.styler.service", [
        function () {
            this.layer = null;
        }
    ])

    /**
    * @memberof hs.styler
    * @ngdoc component
    * @name hs.styler
    */
    .component('hs.styler', stylerComponent);
