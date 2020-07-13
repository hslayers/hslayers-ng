import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';

export default {
  template: require('./partials/styler.html'),
  controller: function (
    $scope,
    HsStylerService,
    $sce,
    $http,
    HsLayoutService,
    HsEventBusService
  ) {
    'ngInject';
    $scope.service = HsStylerService;
    $scope.icons = null;
    $scope.imagetypes = [
      {
        name: 'none',
        hrname: 'None',
      },
      {
        name: 'icon',
        hrname: 'Icon',
      },
      {
        name: 'circle',
        hrname: 'Circle',
      },
    ];
    $scope.imagetype = $scope.imagetypes[0].name;
    $scope.radius = 5;
    $scope.linewidth = 2;
    $scope.iconlinewidth = 2;
    /**
     * @function save
     * @memberOf hs.styler.controller
     * @description Get current style variables value and style current layer accordingly
     * @param layer
     */
    $scope.getLayerSource = function (layer) {
      let src = [];
      if (angular.isDefined(layer.getSource().getSource)) {
        src = layer.getSource().getSource();
      } else {
        src = layer.getSource();
      }
      return src;
    };
    $scope.save = function () {
      if (HsStylerService.layer === null) {
        return;
      }
      const source = $scope.getLayerSource(HsStylerService.layer);
      const style_json = {};
      if (angular.isDefined($scope.fillcolor) && $scope.fillcolor !== null) {
        style_json.fill = new Fill({
          color: $scope.fillcolor['background-color'],
        });
      }
      if (
        angular.isDefined($scope.linecolor) &&
        $scope.linecolor !== null &&
        $scope.linewidth > 0
      ) {
        style_json.stroke = new Stroke({
          color: $scope.linecolor['background-color'],
          width: angular.isDefined($scope.linewidth)
            ? parseFloat($scope.linewidth)
            : 1,
        });
      }
      if ($scope.imagetype != 'none') {
        if (
          $scope.imagetype == 'circle' &&
          (angular.isDefined($scope.iconfillcolor) ||
            angular.isDefined($scope.iconlinecolor))
        ) {
          const circle_json = {
            radius: angular.isDefined($scope.radius)
              ? parseFloat($scope.radius)
              : 5,
          };
          if (
            angular.isDefined($scope.iconfillcolor) &&
            $scope.iconfillcolor !== null
          ) {
            circle_json.fill = new Fill({
              color: $scope.iconfillcolor['background-color'],
            });
          }
          if (
            angular.isDefined($scope.iconlinecolor) &&
            $scope.iconlinecolor !== null &&
            angular.isDefined($scope.iconlinewidth) &&
            $scope.iconlinewidth > 0
          ) {
            circle_json.stroke = new Stroke({
              color: $scope.iconlinecolor['background-color'],
              width: $scope.iconlinewidth,
              radius: angular.isDefined($scope.radius)
                ? parseFloat($scope.radius)
                : 5,
            });
          }
          style_json.image = new Circle(circle_json);
        }
        if (
          $scope.imagetype == 'icon' &&
          angular.isDefined($scope.serialized_icon)
        ) {
          const img = new Image();
          img.src = $scope.serialized_icon;
          img.onload = function () {
            const icon_json = {
              img: img,
              imgSize: [img.width, img.height],
              anchor: [0.6, 0.8],
              crossOrigin: 'anonymous',
            };
            style_json.image = new Icon(icon_json);
            angular.forEach(source.getFeatures(), (f) => {
              f.setStyle(null);
            });
            HsStylerService.layer.setStyle(new Style(style_json));
          };
        }
      }
      if (
        angular.isDefined(style_json.fill) ||
        angular.isDefined(style_json.stroke) ||
        angular.isDefined(style_json.image)
      ) {
        const style = new Style(style_json);
        angular.forEach(source.getFeatures(), (f) => {
          f.setStyle(null);
        });
        HsStylerService.layer.setStyle(style);
      }
    };

    /**
     * @function iconSelected
     * @memberOf hs.styler.controller
     * @param {string} i Icon name
     * @description Load selected SVG icon from folder and use it for layer
     */

    $scope.iconSelected = function (i) {
      $http({url: '' + i}).then(
        (response) => {
          $scope.iconimage = $sce.trustAsHtml(response.data);
          colorIcon();
          $scope.save();
        },
        (err) => {}
      );
    };

    /**
     * @function colorIcon
     * @memberOf hs.styler.controller
     * @description Change colors of selected icon based on user input. Decode modifyied icon into Base-64
     */
    function colorIcon() {
      const iconPreview = document.getElementsByClassName(
        'hs-styler-selected-icon-box'
      )[0];
      const svgPath = iconPreview.querySelector('path');
      if (!svgPath) {
        return;
      }
      if (
        angular.isDefined($scope.iconfillcolor) &&
        $scope.iconfillcolor !== null
      ) {
        svgPath.style.fill = $scope.iconfillcolor['background-color'];
      }
      if (
        angular.isDefined($scope.iconlinecolor) &&
        $scope.iconlinecolor !== null
      ) {
        svgPath.style.stroke = $scope.iconlinecolor['background-color'];
      }
      if (
        angular.isDefined($scope.iconlinewidth) &&
        $scope.iconlinewidth !== null
      ) {
        svgPath.style.strokeWidth = $scope.iconlinewidth;
      }
      $scope.serialized_icon =
        'data:image/svg+xml;base64,' + window.btoa(iconPreview.innerHTML);
    }

    /**
     * @function setImageType
     * @memberOf hs.styler.controller
     * @params {String} t New image type
     * @description Change image type for point geometry and redraw style
     * @param t
     */
    $scope.setImageType = function (t) {
      $scope.imagetype = t;
      $scope.save();
    };
    ($scope.layermanager = function () {
      HsLayoutService.setMainPanel('layermanager');
    }),
      $scope.$watch('linecolor', $scope.save);
    $scope.$watch('service.layer', updateHasVectorFeatures);

    /**
     * @function updateHasVectorFeatures
     * @memberOf hs.styler.controller
     * @description (PRIVATE) Get geometry type and title for selected layer
     */
    function updateHasVectorFeatures() {
      if (HsStylerService.layer === null) {
        return;
      }
      const src = $scope.getLayerSource(HsStylerService.layer);
      if (
        angular.isUndefined(HsStylerService.layer) ||
        HsStylerService.layer === null
      ) {
        return;
      }
      calculateHasLinePointPoly(src);
      $scope.hasLine = src.hasLine;
      $scope.hasPoly = src.hasPoly;
      $scope.hasPoint = src.hasPoint;
      $scope.layerTitle = HsStylerService.layer.get('title');
    }

    /**
     * @function calculateHasLinePointPoly
     * @memberOf hs.styler.controller
     * @description (PRIVATE) Calculate vector type if not specified in layer metadata
     * @param src
     */
    function calculateHasLinePointPoly(src) {
      src.hasLine = false;
      src.hasPoly = false;
      src.hasPoint = false;
      angular.forEach(src.getFeatures(), (f) => {
        if (f.getGeometry()) {
          switch (f.getGeometry().getType()) {
            case 'LineString' || 'MultiLineString':
              src.hasLine = true;
              break;
            case 'Polygon' || 'MultiPolygon':
              src.hasPoly = true;
              break;
            case 'Point' || 'MultiPoint':
              src.hasPoint = true;
              break;
          }
        }
      });
    }

    $scope.$watch('fillcolor', $scope.save);
    $scope.$watch('iconfillcolor', () => {
      if ($scope.imagetype == 'icon') {
        colorIcon();
      }
      $scope.save();
    });
    $scope.$watch('iconlinecolor', () => {
      if ($scope.imagetype == 'icon') {
        colorIcon();
      }
      $scope.save();
    });
    $scope.$watch('iconlinewidth', () => {
      if ($scope.imagetype == 'icon') {
        colorIcon();
      }
      $scope.save();
    });
    $scope.$watch('radius', () => {
      $scope.save();
    });

    HsEventBusService.mainPanelChanges.subscribe((panel) => {
      if (HsLayoutService.mainpanel == 'styler' && $scope.icons === null) {
        $scope.icons = [
          require('./img/svg/bag1.svg'),
          require('./img/svg/banking4.svg'),
          require('./img/svg/bar.svg'),
          require('./img/svg/beach17.svg'),
          require('./img/svg/bicycles.svg'),
          require('./img/svg/building103.svg'),
          require('./img/svg/bus4.svg'),
          require('./img/svg/cabinet9.svg'),
          require('./img/svg/camping13.svg'),
          require('./img/svg/caravan.svg'),
          require('./img/svg/church15.svg'),
          require('./img/svg/church1.svg'),
          require('./img/svg/coffee-shop1.svg'),
          require('./img/svg/disabled.svg'),
          require('./img/svg/favourite28.svg'),
          require('./img/svg/football1.svg'),
          require('./img/svg/footprint.svg'),
          require('./img/svg/gift-shop.svg'),
          require('./img/svg/gps40.svg'),
          require('./img/svg/gps41.svg'),
          require('./img/svg/gps42.svg'),
          require('./img/svg/gps43.svg'),
          require('./img/svg/gps5.svg'),
          require('./img/svg/hospital.svg'),
          require('./img/svg/hot-air-balloon2.svg'),
          require('./img/svg/information78.svg'),
          require('./img/svg/library21.svg'),
          require('./img/svg/location6.svg'),
          require('./img/svg/luggage13.svg'),
          require('./img/svg/monument1.svg'),
          require('./img/svg/mountain42.svg'),
          require('./img/svg/museum35.svg'),
          require('./img/svg/park11.svg'),
          require('./img/svg/parking28.svg'),
          require('./img/svg/pharmacy17.svg'),
          require('./img/svg/port2.svg'),
          require('./img/svg/restaurant52.svg'),
          require('./img/svg/road-sign1.svg'),
          require('./img/svg/sailing-boat2.svg'),
          require('./img/svg/ski1.svg'),
          require('./img/svg/swimming26.svg'),
          require('./img/svg/telephone119.svg'),
          require('./img/svg/toilets2.svg'),
          require('./img/svg/train-station.svg'),
          require('./img/svg/university2.svg'),
          require('./img/svg/warning.svg'),
          require('./img/svg/wifi8.svg'),
        ];
      }

      updateHasVectorFeatures();
    });

    $scope.$emit('scope_loaded', 'styler');
  },
};
