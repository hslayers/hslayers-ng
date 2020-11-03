/* eslint-disable angular/on-watch */
import './layer-parser.module';
import 'angular';

/**
 * @param $rootScope
 * @param $location
 * @param $http
 * @param HsMapService
 * @param HsCore
 * @param HsCompositionsParserService
 * @param HsConfig
 * @param HsPermalinkUrlService
 * @param HsUtilsService
 * @param HsStatusManagerService
 * @param HsCompositionsMickaService
 * @param HsCompositionsStatusManagerMickaJointService
 * @param HsCompositionsLaymanService
 * @param $log
 * @param $window
 * @param HsCommonEndpointsService
 * @param HsCompositionsMapService
 * @param HsLayoutService
 * @param $compile
 */
export default function (
  $rootScope,
  $location,
  $http,
  HsMapService,
  HsCore,
  HsCompositionsParserService,
  HsConfig,
  HsPermalinkUrlService,
  HsUtilsService,
  HsStatusManagerService,
  HsCompositionsMickaService,
  HsCompositionsStatusManagerMickaJointService,
  HsCompositionsLaymanService,
  $log,
  $window,
  HsCommonEndpointsService,
  HsCompositionsMapService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    data: {},

    datasetSelect(id_selected) {
      me.data.id_selected = id_selected;
    },

    loadCompositions(ds, params) {
      return new Promise((resolve, reject) => {
        HsCompositionsMapService.clearExtentLayer();
        const bbox = HsMapService.getMapExtentInEpsg4326();
        me.managerByType(ds)
          .loadList(ds, params, bbox, HsCompositionsMapService.extentLayer)
          .then((_) => {
            resolve();
          });
      });
    },

    resetCompositionCounter() {
      HsCommonEndpointsService.endpoints.forEach((ds) => {
        if (ds.type == 'micka') {
          HsCompositionsMickaService.resetCompositionCounter(ds);
        }
      });
    },

    managerByType(endpoint) {
      switch (endpoint.type) {
        case 'micka':
          return HsCompositionsStatusManagerMickaJointService;
        case 'layman':
          return HsCompositionsLaymanService;
        default:
          const error = `Endpoint type '${endpoint.type} not supported`;
          $log.warn(error);
          HsCompositionsParserService.createErrorDialog(error);
      }
    },

    deleteComposition(composition) {
      const endpoint = composition.endpoint;
      me.managerByType(endpoint).delete(endpoint, composition);
    },

    shareComposition(record) {
      const compositionUrl =
        (HsCore.isMobile() && HsConfig.permalinkLocation
          ? HsConfig.permalinkLocation.origin +
            HsConfig.permalinkLocation.pathname
          : $location.protocol() + '://' + location.host + location.pathname) +
        '?composition=' +
        encodeURIComponent(me.getRecordLink(record));
      const shareId = HsUtilsService.generateUuid();
      $http({
        method: 'POST',
        url: HsStatusManagerService.endpointUrl(),
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
          HsUtilsService.shortUrl(
            HsStatusManagerService.endpointUrl() +
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
            HsConfig.social_hashtag &&
            me.data.shareTitle.indexOf(HsConfig.social_hashtag) <= 0
          ) {
            me.data.shareTitle += ' ' + HsConfig.social_hashtag;
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

    getRecordLink(record) {
      try {
        let url;
        if (angular.isDefined(record.link)) {
          url = record.link;
        } else if (angular.isDefined(record.links)) {
          url = record.links.filter(
            (l) => l.url.indexOf('/file') > -1 || l.url.indexOf('.wmc') > -1
          )[0].url;
        }
        return url;
      } catch (e) {
        const text = 'Selected compostion format not supported';
        HsCompositionsParserService.createErrorDialog(text, e);
      }
    },

    loadCompositionParser(record) {
      return new Promise((resolve, reject) => {
        let url;
        switch (record.endpoint.type) {
          case 'micka':
            url = me.getRecordLink(record);
            break;
          case 'layman':
            url =
              record.url.replace('http://', $location.protocol() + '://') +
              '/file';
            break;
          default:
            const error = `Endpoint type '${record.endpoint.type} not supported`;
            $log.warn(error);
            HsCompositionsParserService.createErrorDialog(error);
        }
        if (url) {
          if (HsCompositionsParserService.composition_edited == true) {
            $rootScope.$broadcast('loadComposition.notSaved', url);
            reject();
          } else {
            me.loadComposition(url, true).then(() => {
              resolve();
            });
          }
        }
      });
    },

    /**
     * @function parsePermalinkLayers
     * @memberof HsCompositionsService
     * Load layers received through permalink to map
     */
    async parsePermalinkLayers() {
      await HsMapService.loaded();
      const layersUrl = HsUtilsService.proxify(
        HsPermalinkUrlService.getParamValue('permalink')
      );
      const response = await $http({url: layersUrl});
      if (response.data.success == true) {
        const data = {};
        data.data = {};
        if (angular.isDefined(response.data.data.layers)) {
          data.data.layers = response.data.data.layers;
        } else {
          //Some old structure, where layers are stored in data
          data.data.layers = response.data.data;
        }
        HsCompositionsParserService.removeCompositionLayers();
        const layers = HsCompositionsParserService.jsonToLayers(data);
        for (let i = 0; i < layers.length; i++) {
          HsMapService.addLayer(layers[i], true);
        }
      } else {
        if (console) {
          $log.log('Error loading permalink layers');
        }
      }
    },

    loadComposition(url, overwrite) {
      return HsCompositionsParserService.loadUrl(url, overwrite);
    },
  });

  /**
   *
   */
  async function tryParseCompositionFromCookie() {
    if (
      angular.isDefined(localStorage.getItem('hs_layers')) &&
      $window.permalinkApp != true
    ) {
      await HsMapService.loaded();
      const data = localStorage.getItem('hs_layers');
      const layers = HsCompositionsParserService.jsonToLayers(
        angular.fromJson(data)
      );
      for (const layer of layers) {
        HsMapService.addLayer(layer, false);
      }
      localStorage.removeItem('hs_layers');
    }
  }

  /**
   *
   */
  function tryParseCompositionFromUrlParam() {
    if (HsPermalinkUrlService.getParamValue('composition')) {
      let id = HsPermalinkUrlService.getParamValue('composition');
      if (
        id.indexOf('http') == -1 &&
        id.indexOf(HsConfig.status_manager_url) == -1
      ) {
        id = HsStatusManagerService.endpointUrl() + '?request=load&id=' + id;
      }
      HsCompositionsParserService.loadUrl(id);
    }
  }

  tryParseCompositionFromCookie();
  tryParseCompositionFromUrlParam();
  if (HsPermalinkUrlService.getParamValue('permalink')) {
    me.parsePermalinkLayers();
  }

  $rootScope.$on('core.map_reset', (event, data) => {
    HsCompositionsParserService.composition_loaded = null;
    HsCompositionsParserService.composition_edited = false;
  });

  $rootScope.$on('compositions.composition_edited', (event) => {
    HsCompositionsParserService.composition_edited = true;
  });

  $rootScope.$on('compositions.load_composition', (event, id) => {
    id = `${HsStatusManagerService.endpointUrl()}?request=load&id=${id}`;
    HsCompositionsParserService.loadUrl(id);
  });

  $rootScope.$on('infopanel.feature_selected', (event, feature, selector) => {
    const record = HsCompositionsMapService.getFeatureRecordAndUnhighlight(
      feature,
      selector
    );
    if (record) {
      me.loadComposition(me.getRecordLink(record));
    }
  });

  return me;
}
