import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import {Style, Icon, Stroke, Fill, Circle} from 'ol/style';
import {Polygon, LineString, GeometryType, Point} from 'ol/geom';
import Feature from 'ol/Feature';
import {transform, transformExtent} from 'ol/proj';
import {toStringHDMS, createStringXY} from 'ol/coordinate';
import {toLonLat} from 'ol/proj.js';

export default ['$rootScope', 'hs.map.service', 'Core', '$sce', 'config', 'hs.layout.service', 'hs.utils.service', '$timeout', 'gettext',
  function ($rootScope, OlMap, Core, $sce, config, layoutService, utils, $timeout, gettext) {
    const me = this;

    let map;

    this.queryPoint = new Point([0, 0]);
    this.queryLayer = new VectorLayer({
      title: 'Point clicked',
      queryable: false,
      source: new Vector({
        features: [new Feature({
          geometry: me.queryPoint
        })]
      }),
      show_in_manager: false,
      removable: false,
      style: pointClickedStyle
    });

    this.data = {};
    this.data.attributes = [];
    this.data.features = [];
    this.data.featureInfoHtmls = [];
    this.data.customFeatures = [];
    this.data.coordinates = [];
    this.queryActive = false;
    this.popupClassname = '';
    this.selector = null;
    this.currentQuery = null;
    this.featuresUnderMouse = [];
    this.featureLayersUnderMouse = [];
    this.dataCleared = true;

    function init() {
      map = OlMap.map;
      me.activateQueries();
      map.on('singleclick', (evt) => {
        $rootScope.$broadcast('mapClicked', angular.extend(evt, {
          coordinates: getCoordinate(evt.coordinate)
        }));
        if (!me.queryActive) {
          return;
        }
        me.popupClassname = '';
        if (!me.dataCleared) {
          me.clearData();
        }
        me.dataCleared = false;
        me.currentQuery = (Math.random() + 1).toString(36).substring(7);
        me.setData(getCoordinate(evt.coordinate), 'coordinates', true);
        me.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
        $rootScope.$broadcast('mapQueryStarted', evt);
      });

      function changeHandler(e) {
        if (e.dragging) {
          return;
        }
        const map = e.map;
        $timeout(_ => {
          me.featuresUnderMouse = map.getFeaturesAtPixel(e.pixel);
          if (me.featuresUnderMouse !== null) {
            me.featuresUnderMouse = me.featuresUnderMouse.filter(feature => {
              return feature.getLayer(map) && feature.getLayer(map).get('title').length > 0;
            });
            me.featureLayersUnderMouse = me.featuresUnderMouse.map(f => f.getLayer(OlMap.map));
            me.featureLayersUnderMouse = utils.removeDuplicates(me.featureLayersUnderMouse, 'title');
            me.featureLayersUnderMouse = me.featureLayersUnderMouse.map(l => {
              return {
                layer: l.get('title'),
                features: me.featuresUnderMouse.filter(f => f.getLayer(OlMap.map) == l)
              };
            });
            me.featuresUnderMouse.forEach(feature => {
              serializeFeatureAtributes(feature);
              if (feature.get('features')) {
                feature.get('features').forEach(subfeature => serializeFeatureAtributes(subfeature));
              }
            });
            const pixel = e.pixel;
            pixel[0] += 2;
            pixel[1] += 4;
            me.hoverPopup.setPosition(map.getCoordinateFromPixel(pixel));
          } else {
            me.featuresUnderMouse = [];
          }
        }, 0);

      }
      map.on('pointermove', utils.debounce(changeHandler, 500, false, me));

    }

    function serializeFeatureAtributes(feature) {
      const layer = feature.getLayer(OlMap.map);
      const allowedKeys = layer.get('hoveredKeys');
      if (angular.isUndefined(allowedKeys)) {
        return [];
      }
      feature.attributesForHover = feature.getKeys()
        .filter(key => allowedKeys.indexOf(key) > -1)
        .map(key => {
          return {key: tryTranslate(key, layer), value: feature.get(key)};
        });
    }

    function tryTranslate(key, layer) {
      const translations = layer.get('hoveredKeysTranslations');
      if (angular.isUndefined(translations)) {
        return key;
      }
      if (angular.isUndefined(translations[key])) {
        return key;
      }
      return translations[key];
    }

    OlMap.loaded().then(init);
    this.setData = function (data, type, overwrite) {
      if (angular.isDefined(type)) {
        if (angular.isDefined(overwrite) && overwrite) {
          me.data[type].length = 0;
        }
        if (angular.isArray(data)) {
          me.data[type] = me.data[type].concat(data);
        } else {
          me.data[type].push(data);
        }
        $rootScope.$broadcast('infopanel.updated'); //Compatibility, deprecated
        $rootScope.$broadcast('query.dataUpdated', me.data);
      } else if (console) {
        console.log('Query.BaseService.setData type not passed');
      }
    };
    this.clearData = function (type) {
      if (type) {
        me.data[type].length = 0;
      } else {
        me.data.attributes.length = 0;
        me.data.features = [];
        me.data.coordinates.length = 0;
        me.data.featureInfoHtmls = [];
        me.data.customFeatures = [];
      }
      const invisiblePopup = me.getInvisiblePopup();
      if (invisiblePopup) {
        invisiblePopup.contentDocument.body.innerHTML = '';
        invisiblePopup.style.height = 0;
        invisiblePopup.style.width = 0;
      }
      me.dataCleared = true;
    };

    this.getInvisiblePopup = function () {
      return document.getElementById('invisible_popup');
    };

    this.pushFeatureInfoHtml = (html) => {
      me.data.featureInfoHtmls.push($sce.trustAsHtml(html));
      me.dataCleared = false;
    };

    this.fillIframeAndResize = function (iframe, response, append) {
      var iframe = me.getInvisiblePopup();
      if (append) {
        iframe.contentDocument.body.innerHTML += response;
      } else {
        iframe.contentDocument.body.innerHTML = response;
      }
      let tmp_width = iframe.contentDocument.innerWidth;
      if (tmp_width > layoutService.contentWrapper.querySelector('.hs-ol-map').clientWidth - 60) {
        tmp_width = layoutService.contentWrapper.querySelector('.hs-ol-map').clientWidth - 60;
      }
      iframe.style.width = tmp_width + 'px';
      let tmp_height = iframe.contentDocument.innerHeight;
      if (tmp_height > 700) {
        tmp_height = 700;
      }
      iframe.style.height = tmp_height + 'px';
    };

    function getCoordinate(coordinate) {
      me.queryPoint.setCoordinates(coordinate, 'XY');
      const epsg4326Coordinate = transform(coordinate,
        map.getView().getProjection(), 'EPSG:4326'
      );
      const coords = {
        name: gettext('Coordinates'),
        mapProjCoordinate: coordinate,
        epsg4326Coordinate,
        projections: [{
          'name': 'EPSG:4326',
          'value': toStringHDMS(epsg4326Coordinate)
        },
        {
          'name': 'EPSG:4326',
          'value': createStringXY(7)(epsg4326Coordinate)
        }, {
          'name': map.getView().getProjection().getCode(),
          'value': createStringXY(7)(coordinate)
        }]
      };
      return coords;
    }

    this.activateQueries = function () {
      if (me.queryActive) {
        return;
      }
      me.queryActive = true;
      OlMap.loaded().then(map => {
        map.addLayer(me.queryLayer);
        $rootScope.$broadcast('queryStatusChanged', true);
      });
    };
    this.deactivateQueries = function () {
      if (!me.queryActive) {
        return;
      }
      me.queryActive = false;
      OlMap.loaded().then(map => {
        map.removeLayer(me.queryLayer);
        $rootScope.$broadcast('queryStatusChanged', false);
      });
    };
    me.nonQueryablePanels = ['measure', 'composition_browser', 'analysis', 'sensors'];

    this.currentPanelQueryable = function () {
      return (me.nonQueryablePanels.indexOf(layoutService.mainpanel) == -1 && me.nonQueryablePanels.indexOf('*') == -1);
    };

    function pointClickedStyle(feature) {
      const defaultStyle = new Style({
        image: new Circle({
          fill: new Fill({
            color: 'rgba(255, 156, 156, 0.4)'
          }),
          stroke: new Stroke({
            color: '#cc3333',
            width: 1
          }),
          radius: 5
        })
      });

      if (angular.isDefined(config.queryPoint)) {
        if (config.queryPoint == 'hidden') {
          defaultStyle.getImage().setRadius(0);
        } else if (config.queryPoint == 'notWithin') {
          if (me.selector.getFeatures().getLength() > 0) {
            defaultStyle.getImage().setRadius(0);
          }
        }
      }
      return defaultStyle;
    }
    if (me.deregisterVectorSelectorCreated) {
      me.deregisterVectorSelectorCreated();
    }
    me.deregisterVectorSelectorCreated = $rootScope.$on('vectorSelectorCreated', (e, selector) => {
      me.selector = selector;
    });
  }];
