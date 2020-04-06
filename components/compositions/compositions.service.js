/* eslint-disable angular/on-watch */
import 'angular';
import './layer-parser.module';

export default ['$rootScope', '$location', '$http', 'hs.map.service',
  'Core', 'hs.compositions.service_parser',
  'config', 'hs.permalink.urlService', '$cookies',
  'hs.utils.service', 'hs.statusManagerService',
  'hs.compositions.mickaService', 'hs.compositions.statusManagerService',
  'hs.compositions.laymanService', '$log', '$window', 'hs.common.endpointsService', 'hs.compositions.mapService',
  function ($rootScope, $location, $http, OlMap, Core, compositionParser,
    config, permalink, $cookies, utils, statusManagerService,
    mickaEndpointService, statusManagerEndpointService, laymanEndpointService, $log, $window, endpointsService, mapService) {
    const me = this;
    angular.extend(me, {
      data: {},

      datasetSelect(id_selected) {
        me.data.id_selected = id_selected;
      },

      loadCompositions(ds, params) {
        return new Promise((resolve, reject) => {
          mapService.clearExtentLayer();
          const bbox = OlMap.getMapExtentInEpsg4326();
          switch (ds.type) {
            case 'micka':
              mickaEndpointService.loadList(ds, params, bbox, mapService.extentLayer)
                .then(() => {
                  statusManagerEndpointService.loadList(ds, params, bbox);
                  resolve();
                });
              break;
            case 'layman':
              laymanEndpointService.loadList(ds, params, bbox, mapService.extentLayer).then(_ => resolve());
              break;
            default:
              $log.warn(`Endpoint type '${ds.type} not supported`);
          }
        });
      },

      resetCompositionCounter() {
        endpointsService.endpoints.forEach(ds => {
          if (ds.type == 'micka') {
            mickaEndpointService.resetCompositionCounter(ds);
          }
        });
      },

      deleteComposition(composition) {
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
          default:
            $log.warn(`Endpoint type '${endpoint.type} not supported`);
        }
        url = utils.proxify(url);
        $http({url, method}).
          then((response) => {
            $rootScope.$broadcast('compositions.composition_deleted', composition);
          }, (err) => {

          });
      },

      shareComposition(record) {
        const compositionUrl = (Core.isMobile() && config.permalinkLocation ? (config.permalinkLocation.origin + config.permalinkLocation.pathname) : ($location.protocol() + '://' + location.host + location.pathname)) + '?composition=' + encodeURIComponent(record.link);
        const shareId = utils.generateUuid();
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
              $log.log('Error creating short Url');
            });
          me.data.shareTitle = record.title;
          if (config.social_hashtag && me.data.shareTitle.indexOf(config.social_hashtag) <= 0) {
            me.data.shareTitle += ' ' + config.social_hashtag;
          }

          me.data.shareDescription = record.abstract;
          $rootScope.$broadcast('composition.shareCreated', me.data);
        }, (err) => { });
      },

      getCompositionInfo(composition, cb) {
        let url;
        switch (composition.endpoint.type) {
          case 'micka':
            url = composition.link;
            break;
          case 'layman':
            url = composition.endpoint.url + composition.url;
            break;
          default:
            $log.warn(`Endpoint type '${composition.endpoint.type} not supported`);
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
            default:
              $log.warn(`Endpoint type '${composition.endpoint.type} not supported`);
          }
          cb(me.data.info);
        });
      },

      loadCompositionParser(record) {
        return new Promise((resolve, reject) => {
          let url;
          switch (record.endpoint.type) {
            case 'micka':
              url = record.link;
              break;
            case 'layman':
              url = record.endpoint.url + record.url + '/file';
              break;
            default:
              $log.warn(`Endpoint type '${record.endpoint.type} not supported`);
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
      },

      /**
      * @function parsePermalinkLayers
      * @memberof hs.compositions.service
      * Load layers received through permalink to map
      */
      parsePermalinkLayers() {
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
                $log.log('Error loading permalink layers');
              }
            }
          }, (err) => {

          });
      },

      loadComposition(url, overwrite) {
        return compositionParser.loadUrl(url, overwrite);
      }
    });


    function tryParseCompositionFromCookie() {
      if (angular.isDefined($cookies.get('hs_layers')) && $window.permalinkApp != true) {
        const data = $cookies.get('hs_layers');
        const layers = compositionParser.jsonToLayers(angular.fromJson(data));
        for (let i = 0; i < layers.length; i++) {
          OlMap.addLayer(layers[i]);
        }
        $cookies.remove('hs_layers');
      }
    }

    function tryParseCompositionFromUrlParam() {
      if (permalink.getParamValue('composition')) {
        let id = permalink.getParamValue('composition');
        if (id.indexOf('http') == -1 && id.indexOf(config.status_manager_url) == -1) {
          id = statusManagerService.endpointUrl() + '?request=load&id=' + id;
        }
        compositionParser.loadUrl(id);
      }
    }

    tryParseCompositionFromCookie();
    tryParseCompositionFromUrlParam();
    if (permalink.getParamValue('permalink')) {
      permalink.parsePermalinkLayers();
    }

    $rootScope.$on('core.map_reset', (event, data) => {
      compositionParser.composition_loaded = null;
      compositionParser.composition_edited = false;
    });

    $rootScope.$on('compositions.composition_edited', (event) => {
      compositionParser.composition_edited = true;
    });

    $rootScope.$on('compositions.load_composition', (event, id) => {
      id = `${statusManagerService.endpointUrl()}?request=load&id=${id}`;
      compositionParser.loadUrl(id);
    });

    $rootScope.$on('infopanel.feature_selected', (event, feature, selector) => {
      const record = mapService.getFeatureRecordAndUnhighlight(feature, selector);
      if (record) {
        me.loadComposition(record.link);
      }
    });

    return me;
  }];
