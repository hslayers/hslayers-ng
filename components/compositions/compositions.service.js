import 'angular';
import {Vector} from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import SparqlJson from 'hs.source.SparqlJson';
import social from 'angular-socialshare';
import './layer-parser.module';
import {Style, Stroke, Fill} from 'ol/style';

export default ['$rootScope', '$location', '$http', 'hs.map.service',
  'Core', 'hs.compositions.service_parser',
  'config', 'hs.permalink.urlService', '$compile', '$cookies',
  'hs.utils.service', 'hs.statusManagerService',
  'hs.compositions.mickaService', 'hs.compositions.statusManagerService',
  'hs.compositions.laymanService', 'hs.layout.service',
  function ($rootScope, $location, $http, OlMap, Core, compositionParser,
    config, permalink, $compile, $cookies, utils, statusManagerService,
    mickaEndpointService, statusManagerEndpointService, laymanEndpointService, layoutService) {
    const me = this;

    me.data = {

    };

    const extentLayer = new VectorLayer({
      title: 'Composition extents',
      show_in_manager: false,
      source: new Vector(),
      removable: false,
      style: function (feature, resolution) {
        return [new Style({
          stroke: new Stroke({
            color: '#005CB6',
            width: feature.get('highlighted') ? 4 : 1
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.01)'
          })
        })];
      }
    });

    me.datasetSelect = function (id_selected) {
      me.data.id_selected = id_selected;
    };

    me.loadCompositions = function (ds, params) {
      return new Promise((resolve, reject) => {
        extentLayer.getSource().clear();
        const bbox = OlMap.getMapExtentInEpsg4326();
        switch (ds.type) {
          case 'micka':
            mickaEndpointService.loadList(ds, params, bbox, extentLayer)
              .then(() => {
                statusManagerEndpointService.loadList(ds, params, bbox);
                resolve();
              });
            break;
          case 'layman':
            laymanEndpointService.loadList(ds, params, bbox, extentLayer).then(_ => resolve());
            break;
        }
      });
    };

    me.resetCompositionCounter = function () {
      endpointsService.endpoints.forEach(ds => {
        if (ds.type == 'micka') {
          mickaEndpointService.resetCompositionCounter(ds);
        }
      });
    };

    me.deleteComposition = function (composition) {
      const endpoint = composition.endpoint;
      let url;
      let method;
      switch (endpoint.type) {
        case 'micka':
          url = statusManagerService.endpointUrl() + '?request=delete&id=' + composition.id + '&project=' + encodeURIComponent(config.project_name);
          method = 'GET';
          break;
        case 'layman':
          url = endpoint.url + composition.url;
          method = 'DELETE';
          break;
      }
      url = utils.proxify(url);
      $http({url, method}).
        then((response) => {
          $rootScope.$broadcast('compositions.composition_deleted', composition);
        }, (err) => {

        });
    };

    me.highlightComposition = function (composition, state) {
      if (angular.isDefined(composition.feature)) {
        composition.feature.set('highlighted', state);
      }
    };

    function init(map) {
      map.on('pointermove', (evt) => {
        const features = extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
        let somethingDone = false;
        angular.forEach(extentLayer.getSource().getFeatures(), (feature) => {
          if (feature.get('record').highlighted) {
            feature.get('record').highlighted = false;
            somethingDone = true;
          }
        });
        if (features.length) {
          angular.forEach(features, (feature) => {
            if (!feature.get('record').highlighted) {
              feature.get('record').highlighted = true;
              somethingDone = true;
            }
          });
        }
        if (somethingDone && !$rootScope.$$phase) {
          $rootScope.$digest();
        }
      });

      if (angular.isDefined($cookies.get('hs_layers')) && window.permalinkApp != true) {
        const data = $cookies.get('hs_layers');
        const layers = compositionParser.jsonToLayers(JSON.parse(data));
        for (let i = 0; i < layers.length; i++) {
          OlMap.addLayer(layers[i]);
        }
        $cookies.remove('hs_layers');
      }

      map.addLayer(extentLayer);

      if (permalink.getParamValue('composition')) {
        let id = permalink.getParamValue('composition');
        if (id.indexOf('http') == -1 && id.indexOf(config.status_manager_url) == -1) {
          id = statusManagerService.endpointUrl() + '?request=load&id=' + id;
        }
        compositionParser.loadUrl(id);
      }

      if (permalink.getParamValue('permalink')) {
        permalink.parsePermalinkLayers();
      }
    }

    OlMap.loaded().then(init);

    $rootScope.$on('compositions.composition_edited', (event) => {
      compositionParser.composition_edited = true;
    });

    $rootScope.$on('compositions.load_composition', (event, id) => {
      id = statusManagerService.endpointUrl() + '?request=load&id=' + id;
      compositionParser.loadUrl(id);
    });

    $rootScope.$on('infopanel.feature_selected', (event, feature, selector) => {
      if (angular.isDefined(feature.get('is_hs_composition_extent')) && angular.isDefined(feature.get('record'))) {
        const record = feature.get('record');
        feature.set('highlighted', false);
        selector.getFeatures().clear();
        me.loadComposition(record.link);
      }
    });

    me.shareComposition = function (record) {
      const compositionUrl = (Core.isMobile() && config.permalinkLocation ? (config.permalinkLocation.origin + config.permalinkLocation.pathname) : ($location.protocol() + '://' + location.host + location.pathname)) + '?composition=' + encodeURIComponent(record.link);
      const shareId = utils.generateUuid();
      const metadata = {};
      $http({
        method: 'POST',
        url: statusManagerService.endpointUrl(),
        data: angular.toJson({
          request: 'socialShare',
          id: shareId,
          url: encodeURIComponent(compositionUrl),
          title: record.title,
          description: record.abstract,
          image: record.thumbnail || 'https://ng.hslayers.org/img/logo.jpg'
        })
      }).then((response) => {
        utils.shortUrl(statusManagerService.endpointUrl() + '?request=socialshare&id=' + shareId)
          .then((shortUrl) => {
            me.data.shareUrl = shortUrl;
          }).catch(() => {
            console.log('Error creating short Url');
          });
        me.data.shareTitle = record.title;
        if (config.social_hashtag && me.data.shareTitle.indexOf(config.social_hashtag) <= 0) {
          me.data.shareTitle += ' ' + config.social_hashtag;
        }

        me.data.shareDescription = record.abstract;
        if (!$rootScope.$$phase) {
          $rootScope.$digest();
        }
        $rootScope.$broadcast('composition.shareCreated', me.data);
      }, (err) => { });
    };

    me.getCompositionInfo = function (composition, cb) {
      let url;
      switch (composition.endpoint.type) {
        case 'micka':
          url = composition.link;
          break;
        case 'layman':
          url = composition.endpoint.url + composition.url;
          break;
      }
      compositionParser.loadInfo(url, (info) => {
        me.data.info = info;
        switch (composition.endpoint.type) {
          case 'micka':
            me.data.info.thumbnail = composition.thumbnail;
            break;
          case 'layman':
            me.data.info.thumbnail = composition.endpoint.url + info.thumbnail.url;
            me.data.info.abstract = info.description;
            break;
        }
        cb(me.data.info);
      });
    };

    me.loadCompositionParser = function (record) {
      return new Promise((resolve, reject) => {
        let url;
        let title;
        switch (record.endpoint.type) {
          case 'micka':
            url = record.link;
            title = record.title;
            break;
          case 'layman':
            url = record.endpoint.url + record.url + '/file';
            title = record.name;
            break;
        }
        if (compositionParser.composition_edited == true) {
          $rootScope.$broadcast('loadComposition.notSaved', url);
          reject();
        } else {
          me.loadComposition(url, true).then(() => {
            resolve();
          });
        }
      });
    };

    /**
        * @function parsePermalinkLayers
        * @memberof hs.compositions.service
        * Load layers received through permalink to map
        */
    me.parsePermalinkLayers = function () {
      const layersUrl = utils.proxify(permalink.getParamValue('permalink'));
      $http({url: layersUrl}).
        then((response) => {
          if (response.data.success == true) {
            const data = {};
            data.data = {};
            data.data.layers = response.data.data;
            compositionParser.removeCompositionLayers();
            response.layers = response.data.data;
            const layers = compositionParser.jsonToLayers(data);
            for (let i = 0; i < layers.length; i++) {
              OlMap.addLayer(layers[i]);
            }
          } else {
            if (console) {
              console.log('Error loading permalink layers');
            }
          }
        }, (err) => {

        });
    };

    me.loadComposition = function (url, overwrite) {
      return compositionParser.loadUrl(url, overwrite);
    };

    $rootScope.$on('core.map_reset', (event, data) => {
      compositionParser.composition_loaded = null;
      compositionParser.composition_edited = false;
    });

    $rootScope.$on('core.mainpanel_changed', (event) => {
      if (angular.isDefined(extentLayer)) {
        if (layoutService.mainpanel === 'composition_browser' || layoutService.mainpanel === 'composition') {
          extentLayer.setVisible(true);
        } else {
          extentLayer.setVisible(false);
        }
      }
    });

    return me;
  }];
