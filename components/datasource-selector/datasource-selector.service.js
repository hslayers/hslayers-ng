/* eslint-disable angular/on-watch */
export default [
  '$rootScope',
  '$timeout',
  'HsMapService',
  'HsCore',
  'HsConfig',
  'HsAddLayersVectorService',
  'HsMickaFiltersService',
  'HsMickaBrowserService',
  'HsLaymanBrowserService',
  'HsLayoutService',
  '$log',
  'HsCommonEndpointsService',
  'HsUtilsService',
  'HsDataSourceSelectorMapService',
  'forDatasourceBrowserFilter',
  '$compile',
  function (
    $rootScope,
    $timeout,
    OlMap,
    HsCore,
    config,
    addLayersVectorService,
    mickaFilterService,
    mickaService,
    laymanService,
    layoutService,
    $log,
    endpointsService,
    utils,
    mapService,
    forDatasourceBrowserFilter,
    $compile
  ) {
    const me = this;

    this.data = {};

    this.data.query = {
      textFilter: '',
      title: '',
      type: 'service',
      Subject: '',
    };

    this.data.textField = 'AnyText';
    this.data.selectedLayer = null;
    this.data.wms_connecting = false;
    this.data.id_selected = 'OWS';

    /**
     * @function queryCatalogs
     * @memberOf HsDatasourceBrowserService
     * @description Queries all configured catalogs for datasources (layers)
     */
    this.queryCatalogs = function () {
      mapService.clearExtentLayer();
      endpointsService.endpoints.forEach((endpoint) => {
        if (endpoint.datasourcePaging) {
          endpoint.datasourcePaging.start = 0;
        }
        me.queryCatalog(endpoint);
      });
    };

    /**
     * @function queryCatalog
     * @memberOf HsDatasourceBrowserService
     * @param {Object} catalog Configuration of selected datasource (from app config)
     * @description Loads datasets metadata from selected source (CSW server).
     * Uses pagination set by 'start' attribute of 'dataset' param.
     * Currently supports only "Micka" type of source.
     * Use all query params (search text, bbox, params.., sorting, start)
     */
    this.queryCatalog = function (catalog) {
      mapService.clearDatasetFeatures(catalog);
      switch (catalog.type) {
        case 'micka':
          mickaService.queryCatalog(
            catalog,
            me.data.query,
            mapService.addExtentFeature,
            me.data.textField
          );
          break;
        case 'layman':
          laymanService.queryCatalog(catalog);
          break;
        default:
          break;
      }
    };

    /**
     * @function layerDownload
     * @memberOf hs.datasource_selector
     * @param {Object} ds Datasource of selected layer
     * @param {Object} layer Metadata record of selected layer
     * @returns {String} Download url of layer if possible
     * Test if layer of selected record is downloadable (KML and JSON files, with direct url) and gives Url.
     */
    this.layerDownload = function (ds, layer) {
      if (ds.download == true) {
        if (
          ['kml', 'geojson', 'json'].indexOf(layer.formats[0].toLowerCase()) >
            -1 &&
          layer.url.length > 0
        ) {
          return layer.url;
        }
      }
      return '#';
    };

    /**
     * @function layerRDF
     * @memberOf hs.datasource_selector
     * @param {Object} ds Datasource of selected layer
     * @param {Object} layer Metadata record of selected layer
     * @returns {String} URL to record file
     * Get URL for RDF-DCAT record of selected layer
     */
    this.layerRDF = function (ds, layer) {
      return `${ds.url}?request=GetRecordById&id=${layer.id}&outputschema=http://www.w3.org/ns/dcat%23`;
    };

    /**
     * @function addLayerToMap
     * @memberOf hs.datasource_selector
     * @param {Object} ds Datasource of selected layer
     * @param {Object} layer Metadata record of selected layer
     * @param {String} type Type of layer (supported values: WMS, WFS, Sparql, kml, geojson, json)
     * Add selected layer to map (into layer manager) if possible
     */
    this.addLayerToMap = async function (ds, layer, type) {
      let describer = Promise.resolve({type: 'none'});
      if (ds.type == 'micka') {
        describer = mickaService.describeWhatToAdd(ds, layer);
      } else if (ds.type == 'layman') {
        describer = laymanService.describeWhatToAdd(ds, layer);
      }
      describer.then(async (whatToAdd) => {
        if (angular.isDefined(type)) {
          whatToAdd.type = type;
        }
        if (angular.isArray(whatToAdd.type)) {
          const scope = $rootScope.$new();
          Object.assign(scope, {
            types: whatToAdd.type,
            layer,
            endpoint: ds,
          });
          const el = angular.element(
            '<hs-select-type-to-add-layer-dialog layer="layer" endpoint="endpoint" types="types"></hs-select-type-to-add-layer-dialog>'
          );
          layoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
          $compile(el)(scope);
          return;
        }
        if (whatToAdd.type == 'WMS') {
          me.datasetSelect('OWS');
          $timeout(() => {
            $rootScope.$broadcast(
              'ows.filling',
              whatToAdd.type.toLowerCase(),
              decodeURIComponent(whatToAdd.link),
              whatToAdd.layer
            );
          });
        } else if (whatToAdd.type == 'WFS') {
          const layer = await addLayersVectorService.addVectorLayer(
            'wfs',
            whatToAdd.link,
            whatToAdd.title,
            whatToAdd.abstract,
            whatToAdd.projection,
            {extractStyles: whatToAdd.extractStyles}
          );
          addLayersVectorService.fitExtent(layer);
        } else if (['KML', 'GEOJSON'].indexOf(whatToAdd.type) > -1) {
          const layer = await addLayersVectorService.addVectorLayer(
            whatToAdd.type.toLowerCase(),
            whatToAdd.link,
            whatToAdd.title,
            whatToAdd.abstract,
            whatToAdd.projection,
            {extractStyles: whatToAdd.extractStyles}
          );
          addLayersVectorService.fitExtent(layer);
        } else {
          layoutService.setMainPanel('layermanager');
        }
      });
    };

    me.datasetSelect = function (id_selected) {
      me.data.wms_connecting = false;
      me.data.id_selected = id_selected;
      me.calcEntentLayerVisibility();
    };

    /**
     * @function clear
     * @memberOf HsDatasourceBrowserService
     * Clear query variable
     */
    this.clear = function () {
      me.data.query.textFilter = '';
      me.data.query.title = '';
      me.data.query.Subject = '';
      me.data.query.keywords = '';
      me.data.query.OrganisationName = '';
      me.data.query.sortby = '';
    };

    function dataSourceExistsAndEmpty() {
      return (
        forDatasourceBrowserFilter(endpointsService.endpoints).filter((ep) =>
          angular.isUndefined(ep.datasourcePaging.loaded)
        ).length > 0
      );
    }

    function panelVisible() {
      return (
        layoutService.panelVisible('datasource_selector') ||
        layoutService.panelVisible('datasourceBrowser')
      );
    }

    if (dataSourceExistsAndEmpty() && panelVisible()) {
      me.queryCatalogs();
      mickaFilterService.fillCodesets();
    }

    if (angular.isUndefined(config.allowAddExternalDatasets)) {
      config.allowAddExternalDatasets = true;
    }

    $rootScope.$on(
      'map.extent_changed',
      utils.debounce(
        (e) => {
          if (!panelVisible()) {
            return;
          }
          if (mickaFilterService.filterByExtent) {
            me.queryCatalogs();
          }
        },
        500,
        false,
        me
      )
    );

    $rootScope.$on('core.mainpanel_changed', (event) => {
      if (dataSourceExistsAndEmpty() && panelVisible()) {
        me.queryCatalogs();
        mickaFilterService.fillCodesets();
      }
      me.calcEntentLayerVisibility();
    });

    me.calcEntentLayerVisibility = function () {
      mapService.extentLayer.setVisible(
        panelVisible() && me.data.id_selected != 'OWS'
      );
    };

    return me;
  },
];
