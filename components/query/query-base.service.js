import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {createStringXY, toStringHDMS} from 'ol/coordinate';
import {transform} from 'ol/proj';

/**
 * @param $rootScope
 * @param HsMapService
 * @param HsCore
 * @param $sce
 * @param HsConfig
 * @param HsLayoutService
 * @param HsUtilsService
 * @param $timeout
 * @param gettext
 */
export const HsQueryBaseService = function (
  $rootScope,
  HsMapService,
  HsCore,
  $sce,
  HsConfig,
  HsLayoutService,
  HsUtilsService,
  $timeout,
  gettext
) {
  'ngInject';
  const me = this;

  let map;

  this.queryPoint = new Point([0, 0]);
  this.queryLayer = new VectorLayer({
    title: 'Point clicked',
    queryable: false,
    source: new Vector({
      features: [
        new Feature({
          geometry: me.queryPoint,
        }),
      ],
    }),
    show_in_manager: false,
    removable: false,
    style: pointClickedStyle,
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

  /**
   *
   */
  function init() {
    map = HsMapService.map;
    me.activateQueries();
    map.on('singleclick', (evt) => {
      $rootScope.$broadcast(
        'mapClicked',
        angular.extend(evt, {
          coordinates: getCoordinate(evt.coordinate),
        })
      );
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
      me.data.selectedProj = me.data.coordinates[0].projections[0]
      $rootScope.$broadcast('mapQueryStarted', evt);
    });

    if (
      angular.isDefined(HsConfig.popUpDisplay) &&
      HsConfig.popUpDisplay === 'hover'
    ) {
      map.on(
        'pointermove',
        HsUtilsService.debounce(me.showPopUp, 500, false, me)
      );
    } else if (
      angular.isDefined(HsConfig.popUpDisplay) &&
      HsConfig.popUpDisplay === 'click'
    ) {
      map.on(
        'singleclick',
        HsUtilsService.debounce(me.showPopUp, 500, false, me)
      );
    } /* else none */
  }

  /**
   * @param e Event, which triggered this function
   */
  this.showPopUp = function (e) {
    if (e.dragging) {
      return;
    }
    const map = e.map;
    $timeout((_) => {
      me.featuresUnderMouse = map.getFeaturesAtPixel(e.pixel);
      if (me.featuresUnderMouse !== null) {
        me.featuresUnderMouse = me.featuresUnderMouse.filter((feature) => {
          return (
            feature.getLayer &&
            feature.getLayer(map) &&
            feature.getLayer(map).get('title').length > 0 &&
            feature.getLayer(map).get('title') !== 'Point clicked'
          );
        });
        me.featureLayersUnderMouse = me.featuresUnderMouse.map((f) =>
          f.getLayer(HsMapService.map)
        );
        me.featureLayersUnderMouse = HsUtilsService.removeDuplicates(
          me.featureLayersUnderMouse,
          'title'
        );
        me.featureLayersUnderMouse = me.featureLayersUnderMouse.map((l) => {
          return {
            title: l.get('title'),
            layer: l,
            features: me.featuresUnderMouse.filter(
              (f) => f.getLayer(HsMapService.map) == l
            ),
          };
        });
        me.featuresUnderMouse.forEach((feature) => {
          me.serializeFeatureAttributes(feature);
          if (feature.get('features')) {
            feature
              .get('features')
              .forEach((subfeature) =>
                me.serializeFeatureAttributes(subfeature)
              );
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
  };

  /**
   * @param feature
   */
  this.serializeFeatureAttributes = function (feature) {
    if (angular.isUndefined(feature.getLayer)) {
      return;
    }
    const layer = feature.getLayer(HsMapService.map);
    let attrsConfig = [];
    if (
      angular.isDefined(layer.get('popUp')) &&
      angular.isDefined(layer.get('popUp').attributes)
    ) {
      //must be an array
      attrsConfig = layer.get('popUp').attributes;
    } else if (angular.isDefined(layer.get('hoveredKeys'))) {
      //only for backwards-compatibility with HSLayers 1.10 .. 1.22
      //should be dropped in future releases
      //expected to be an array
      attrsConfig = layer.get('hoveredKeys');
      if (angular.isDefined(layer.get('hoveredKeysTranslations'))) {
        //expected to be an object
        for (const [key, val] of Object.entries(
          layer.get('hoveredKeysTranslations')
        )) {
          const index = attrsConfig.indexOf(key);
          if (index > -1) {
            attrsConfig[index] = {
              'attribute': key,
              'label': val,
            };
          }
        }
      }
    } else {
      // Layer is not configured to show pop-ups
      return;
    }
    feature.attributesForHover = [];
    for (const attr of attrsConfig) {
      let attrName, attrLabel;
      let attrFunction = (x) => x;
      if (typeof attr === 'string' || attr instanceof String) {
        //simple case when only attribute name is provided in the layer config
        attrName = attr;
        attrLabel = attr;
      } else {
        if (angular.isUndefined(attr.attribute)) {
          //implies malformed layer config - 'attribute' is obligatory in this case
          continue;
        }
        attrName = attr.attribute;
        attrLabel = angular.isDefined(attr.label) ? attr.label : attr.attribute;
        if (angular.isDefined(attr.displayFunction)) {
          attrFunction = attr.displayFunction;
        }
      }
      if (angular.isDefined(feature.get(attrName))) {
        feature.attributesForHover.push({
          key: attrLabel,
          value: feature.get(attrName),
          displayFunction: attrFunction,
        });
      }
    }
  };

  HsMapService.loaded().then(init);

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
    if (
      tmp_width >
      HsLayoutService.contentWrapper.querySelector('.hs-ol-map').clientWidth -
        60
    ) {
      tmp_width =
        HsLayoutService.contentWrapper.querySelector('.hs-ol-map').clientWidth -
        60;
    }
    iframe.style.width = tmp_width + 'px';
    let tmp_height = iframe.contentDocument.innerHeight;
    if (tmp_height > 700) {
      tmp_height = 700;
    }
    iframe.style.height = tmp_height + 'px';
  };

  /**
   * @param coordinate
   */
  function getCoordinate(coordinate) {
    me.queryPoint.setCoordinates(coordinate, 'XY');
    const epsg4326Coordinate = transform(
      coordinate,
      map.getView().getProjection(),
      'EPSG:4326'
    );
    const coords = {
      name: gettext('Coordinates'),
      mapProjCoordinate: coordinate,
      epsg4326Coordinate,
      projections: [
        {
          'name': 'EPSG:4326',
          'value': toStringHDMS(epsg4326Coordinate),
        },
        {
          'name': 'EPSG:4326',
          'value': createStringXY(7)(epsg4326Coordinate),
        },
        {
          'name': map.getView().getProjection().getCode(),
          'value': createStringXY(7)(coordinate),
        },
      ],
    };
    return coords;
  }

  this.activateQueries = function () {
    if (me.queryActive) {
      return;
    }
    me.queryActive = true;
    HsMapService.loaded().then((map) => {
      map.addLayer(me.queryLayer);
      $rootScope.$broadcast('queryStatusChanged', true);
    });
  };

  this.deactivateQueries = function () {
    if (!me.queryActive) {
      return;
    }
    me.queryActive = false;
    HsMapService.loaded().then((map) => {
      map.removeLayer(me.queryLayer);
      $rootScope.$broadcast('queryStatusChanged', false);
    });
  };

  me.nonQueryablePanels = [
    'measure',
    'composition_browser',
    'analysis',
    'sensors',
    'draw'
  ];

  this.currentPanelQueryable = function () {
    return (
      me.nonQueryablePanels.indexOf(HsLayoutService.mainpanel) == -1 &&
      me.nonQueryablePanels.indexOf('*') == -1
    );
  };

  /**
   * @param feature
   */
  function pointClickedStyle(feature) {
    const defaultStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(255, 156, 156, 0.4)',
        }),
        stroke: new Stroke({
          color: '#cc3333',
          width: 1,
        }),
        radius: 5,
      }),
    });
    if (angular.isDefined(HsConfig.queryPoint)) {
      if (HsConfig.queryPoint == 'hidden') {
        defaultStyle.getImage().setRadius(0);
      } else if (HsConfig.queryPoint == 'notWithin') {
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
  me.deregisterVectorSelectorCreated = $rootScope.$on(
    'vectorSelectorCreated',
    (e, selector) => {
      me.selector = selector;
    }
  );
  return me;
}
