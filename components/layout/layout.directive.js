export default function (HsCore, $timeout, HsConfig, $compile, HsLayoutService) {
  'ngInject';
  return {
	template: HsConfig.design === 'md' ?
		HsConfig.directiveTemplates.layout ||
		require('components/layout/partials/layoutmd.html') :
		require('components/layout/partials/layout.html'),
    link: function (scope, element) {
      HsLayoutService.contentWrapper = element[0].querySelector('.hs-content-wrapper');
      HsLayoutService.layoutElement = element[0];
      try {
        if (angular.module('hs.cesium')) {
          if (element[0].querySelector('.hs-page-content')) {
            let cesiumDir = $compile('<div hs.cesium.directive ng-controller="HsCesiumController"></div>')(scope);
            element[0].querySelector('.hs-page-content').appendChild(cesiumDir[0]);
          }
        }
      } catch (err) { /* failed to require */ }


      HsCore.init(element, {
        innerElement: '.hs-map-container'
      });

      //Hack - flex map container was not initialized when map loaded 
      var container = HsLayoutService.contentWrapper.querySelector('.hs-map-container');
      if (container) {
        if (container.clientHeight === 0) {
          containerCheck();
        }

        function containerCheck() {
          $timeout(function () {
            if (container.clientHeight != 0) scope.$emit("HsCore_sizeChanged");
            else containerCheck();
          }, 100);
        }
      }

      if (angular.isUndefined(HsConfig.importCss) || HsConfig.importCss) {
        if (HsConfig.design == 'md') {
          import(/* webpackChunkName: "lazy-material" */'angular-material');
          import(/* webpackChunkName: "lazy-material" */'angular-material/angular-material.css');
          import(/* webpackChunkName: "lazy-material" */'angular-material-bottom-sheet-collapsible/bottomSheetCollapsible.css');
        } else {
          import(/* webpackChunkName: "lazy-bootstrap" */'bootstrap/dist/css/bootstrap.isolated.css');
          $timeout(_ => {
            if (window.innerWidth < 600) {
              var viewport = document.querySelector('meta[name="viewport"]');
              viewport.setAttribute("content", "width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no");
            }
          }, 500);
        }
        import('ol/ol.css');
        import('css/app.css');
        if (!!window.cordova) {
          import(/* webpackChunkName: "lazy-mobile" */'css/mobile.css')
        }
        import('css/whhg-font/css/whhg.css')

        if (HsConfig.theme) {
          if (HsConfig.theme.sidebar)
            HsLayoutService.layoutElement.style
              .setProperty('--sidebar-bg-color', HsConfig.theme.sidebar.background || null);
          HsLayoutService.layoutElement.style
            .setProperty('--sidebar-item-color', HsConfig.theme.sidebar.itemColor || null);
          HsLayoutService.layoutElement.style
            .setProperty('--sidebar-active-color', HsConfig.theme.sidebar.activeItemColor || null);
        }
      }
    }
  };
}
