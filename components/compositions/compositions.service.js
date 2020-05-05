/* eslint-disable angular/on-watch */
import './layer-parser.module';
import 'angular';

export default [
  '$rootScope',
  '$location',
  '$http',
  'hs.map.service',
  'Core',
  'hs.compositions.service_parser',
  'config',
  'hs.permalink.urlService',
  '$cookies',
  'hs.utils.service',
  'hs.statusManagerService',
  'hs.compositions.mickaService',
  'hs.compositions.statusManagerMickaJointService',
  'hs.compositions.laymanService',
  '$log',
  '$window',
  'hs.common.endpointsService',
  'hs.compositions.mapService',
  function (
    $rootScope,
    $location,
    $http,
    OlMap,
    Core,
    compositionParser,
    config,
    permalink,
    $cookies,
    utils,
    statusManagerService,
    mickaEndpointService,
    statusManagerMickaJointService,
    laymanEndpointService,
    $log,
    $window,
    endpointsService,
    mapService
  ) {
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
          me.managerByType(ds)
            .loadList(ds, params, bbox, mapService.extentLayer)
            .then((_) => {
              resolve();
            });
        });
      },

      resetCompositionCounter() {
        endpointsService.endpoints.forEach((ds) => {
          if (ds.type == 'micka') {
            mickaEndpointService.resetCompositionCounter(ds);
          }
        });
      },

      managerByType(endpoint) {
        switch (endpoint.type) {
          case 'micka':
            return statusManagerMickaJointService;
          case 'layman':
            return laymanEndpointService;
          default:
            $log.warn(`Endpoint type '${endpoint.type} not supported`);
        }
      },

      deleteComposition(composition) {
        const endpoint = composition.endpoint;
        me.managerByType(endpoint).delete(endpoint, composition);
      },

      shareComposition(record) {
        const compositionUrl =
          (Core.isMobile() && config.permalinkLocation
            ? config.permalinkLocation.origin +
              config.permalinkLocation.pathname
            : $location.protocol() +
              '://' +
              location.host +
              location.pathname) +
          '?composition=' +
          encodeURIComponent(record.link);
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
            image: record.thumbnail || 'https://ng.hslayers.org/img/logo.jpg',
          }),
        }).then(
          (response) => {
            utils
              .shortUrl(
                statusManagerService.endpointUrl() +
                  '?request=socialshare&id=' +
                  shareId
              )
              .then((shortUrl) => {
                me.data.shareUrl = shortUrl;
              })
              .catch(() => {
                $log.log('Error creating short Url');
              });
            me.data.shareTitle = record.title;
            if (
              config.social_hashtag &&
              me.data.shareTitle.indexOf(config.social_hashtag) <= 0
            ) {
              me.data.shareTitle += ' ' + config.social_hashtag;
            }

            me.data.shareDescription = record.abstract;
            $rootScope.$broadcast('composition.shareCreated', me.data);
          },
          (err) => {}
        );
      },

      getCompositionInfo(composition, cb) {
        me.managerByType(composition.endpoint)
          .getInfo(composition)
          .then((info) => {
            me.data.info = info;
            cb(info);
          });
      },

      loadCompositionParser(record) {
        return new Promise((resolve, reject) => {
          let url;
          switch (record.endpoint.type) {
            case 'micka':
              if (angular.isDefined(record.link)) {
                url = record.link;
              } else if (angular.isDefined(record.links)) {
                url = record.links.filter((link) =>
                  link.url.contains('/file')
                )[0].url;
              }
              break;
            case 'layman':
              url =
                record.url.replace('http://', $location.protocol() + '://') +
                '/file';
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
      async parsePermalinkLayers() {
        await OlMap.loaded();
        const layersUrl = utils.proxify(permalink.getParamValue('permalink'));
        const response = await $http({url: layersUrl});
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
      },

      loadComposition(url, overwrite) {
        return compositionParser.loadUrl(url, overwrite);
      },
    });

    async function tryParseCompositionFromCookie() {
      if (
        angular.isDefined(localStorage.getItem('hs_layers')) &&
        $window.permalinkApp != true
      ) {
        await OlMap.loaded();
        const data = localStorage.getItem('hs_layers');
        const layers = compositionParser.jsonToLayers(angular.fromJson(data));
        for (let i = 0; i < layers.length; i++) {
          OlMap.addLayer(layers[i]);
        }
        localStorage.removeItem('hs_layers');
      }
    }

    function tryParseCompositionFromUrlParam() {
      if (permalink.getParamValue('composition')) {
        let id = permalink.getParamValue('composition');
        if (
          id.indexOf('http') == -1 &&
          id.indexOf(config.status_manager_url) == -1
        ) {
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
      const record = mapService.getFeatureRecordAndUnhighlight(
        feature,
        selector
      );
      if (record) {
        me.loadComposition(record.link);
      }
    });

    return me;
  },
];
