/* eslint-disable angular/on-watch */
import {Style, Stroke, Fill} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

export default ['$rootScope', '$timeout', 'hs.map.service', 'Core', 'config',
  'hs.addLayersVector.service', 'hs.mickaFiltersService', 'hs.mickaBrowserService', 'hs.laymanBrowserService', 'hs.layout.service', '$log',
  function ($rootScope, $timeout, OlMap, Core, config, addLayersVectorService, mickaFilterService, mickaService, laymanService, layoutService, $log) {
    const me = this;

    this.data = {};

    this.data.query = {
      textFilter: '',
      title: '',
      type: 'service',
      Subject: ''
    };

    this.data.paging = config.dsPaging || 10;
    this.data.textField = 'AnyText';
    this.data.selectedLayer = null;
    this.data.datasources = config.datasources || [];
    this.data.wms_connecting = false;
    this.data.id_selected = 'OWS';

    const extentLayer = new VectorLayer({
      title: 'Datasources extents',
      show_in_manager: false,
      source: new Vector(),
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

    /**
    * @function queryCatalogs
    * @memberOf hs.datasourceBrowserService
    * @description Queries all configured catalogs for datasources (layers)
    */
    this.queryCatalogs = function () {
      extentLayer.getSource().clear();
      for (const ds in me.data.datasources) {
        me.data.datasources[ds].start = 0;
        me.queryCatalog(me.data.datasources[ds]);
      }
    };

    /**
    * @function queryCatalog
    * @memberOf hs.datasourceBrowserService
    * @param {Object} catalog Configuration of selected datasource (from app config)
    * @description Loads datasets metadata from selected source (CSW server).
    * Uses pagination set by 'start' attribute of 'dataset' param.
    * Currently supports only "Micka" type of source.
    * Use all query params (search text, bbox, params.., sorting, paging, start)
    */
    this.queryCatalog = function (catalog) {
      me.clearDatasetFeatures(catalog, extentLayer);
      switch (catalog.type) {
        case 'micka':
          mickaService.queryCatalog(catalog,
            me.data.query,
            me.data.paging,
            me.addExtentFeature,
            me.data.textField);
          break;
        case 'layman':
        default:
          laymanService.queryCatalog(catalog);
          break;
      }
    };

    /**
    * @function addExtentFeature
    * @memberOf hs.datasourceBrowserService
    * @param {ol/Feature} extentFeature Openlayers Feature
    * @description  Callback function which gets executed when extent feature
    * is created. It should add the feature to vector layer source
    */
    this.addExtentFeature = function (extentFeature) {
      extentLayer.getSource().addFeatures([extentFeature]);
    };

    /**
    * @function clearDatasetFeatures
    * @memberOf hs.datasourceBrowserService
    * @param {Object} dataset Configuration of selected datasource (from app config)
    * @param {ol/layer/Vector} extentLayer
    * (PRIVATE) Remove layer extent features from map
    */
    this.clearDatasetFeatures = function (dataset, extentLayer) {
      angular.forEach(dataset.layers, (val) => {
        try {
          if (angular.isDefined(val.feature) && val.feature) {
            extentLayer.getSource().removeFeature(val.feature);
          }
        } catch (ex) {
          $log.warn(ex);
        }
      });
    };

    /**
     * @function isZoomable
     * @memberOf hs.datasourceBrowserService
     * @param {unknown} layer TODO
     * @return {boolean} Returns if bbox is specified and thus layer is zoomable
     * Test if it possible to zoom to layer overview (bbox has to be defined
     * in metadata of selected layer)
     */
    this.isZoomable = function (layer) {
      return angular.isDefined(layer.bbox);
    };

    /**
     * @function zoomTo
     * @memberOf hs.datasource_selector
     * @param {String} bbox Bounding box of selected layer
     * ZoomTo / MoveTo to selected layer overview
     */
    this.zoomTo = function (bbox) {
      if (angular.isUndefined(bbox)) {
        return;
      }
      let b = null;
      if (angular.isString(bbox)) {
        b = bbox.split(' ');
      } else if (angular.isArray(bbox)) {
        b = bbox;
      }
      let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
      let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
      first_pair = transform(first_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
      second_pair = transform(second_pair, 'EPSG:4326', OlMap.map.getView().getProjection());
      if (isNaN(first_pair[0]) || isNaN(first_pair[1]) || isNaN(second_pair[0]) || isNaN(second_pair[1])) {
        return;
      }
      const extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
      OlMap.map.getView().fit(extent, OlMap.map.getSize());
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
        if (['kml', 'geojson', 'json'].indexOf(layer.formats[0].toLowerCase()) > -1 && layer.url.length > 0) {
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
      return ds.url + '?request=GetRecordById&id=' + layer.id + '&outputschema=http://www.w3.org/ns/dcat%23';
    };

    /**
     * @function addLayerToMap
     * @memberOf hs.datasource_selector
     * @param {Object} ds Datasource of selected layer
     * @param {Object} layer Metadata record of selected layer
     * Add selected layer to map (into layer manager) if possible
     * (supported formats: WMS, WFS, Sparql, kml, geojson, json)
     */
    this.addLayerToMap = function (ds, layer) {
      let describer = Promise.resolve({type: 'none'});
      if (ds.type == 'micka') {
        describer = mickaService.describeWhatToAdd(ds, layer);
      } else if (ds.type == 'layman') {
        describer = laymanService.describeWhatToAdd(ds, layer);
      }
      describer.then(whatToAdd => {
        if (['WMS', 'WFS'].indexOf(whatToAdd.type) > -1) {
          me.datasetSelect('OWS');
          $timeout(() => {
            $rootScope.$broadcast('ows.filling',
              whatToAdd.type.toLowerCase(),
              decodeURIComponent(whatToAdd.link),
              whatToAdd.layer);
          });
        } else if (['KML', 'GEOJSON'].indexOf(whatToAdd.type) > -1) {
          addLayersVectorService.add(whatToAdd.type.toLowerCase(), whatToAdd.link,
            whatToAdd.title, whatToAdd.abstract,
            whatToAdd.extractStyles, whatToAdd.projection);
        } else {
          layoutService.setMainPanel('layermanager');
        }
      });

    };

    me.datasetSelect = function (id_selected) {
      me.data.wms_connecting = false;
      me.data.id_selected = id_selected;
    };

    /**
     * @function highlightComposition
     * @memberOf hs.datasourceBrowserService
     * @param {Object} composition Composition record to highlight by drawing its extent in different color or border width
     * @param {Boolean} state Desired visual state of composition
     * (True = highlighted, False = normal)
     * @description Change visual apperance of composition overview in map
     * between highlighted and normal
     */
    this.highlightComposition = function (composition, state) {
      if (angular.isDefined(composition.feature)) {
        composition.feature.set('highlighted', state);
      }
    };

    /**
     * @function clear
     * @memberOf hs.datasourceBrowserService
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
      return me.data.datasources.length > 0 && angular.isUndefined(me.data.datasources[0].loaded);
    }

    function panelVisible() {
      return layoutService.panelVisible('datasource_selector') || layoutService.panelVisible('datasourceBrowser');
    }

    function init(map) {
      map.on('pointermove', (evt) => {
        const features = extentLayer.getSource().getFeaturesAtCoordinate(evt.coordinate);
        let somethingChanged = false;
        angular.forEach(extentLayer.getSource().getFeatures(), (feature) => {
          if (feature.get('record').highlighted) {
            feature.get('record').highlighted = false;
            somethingChanged = true;
          }
        });
        if (features.length) {
          angular.forEach(features, (feature) => {
            if (!feature.get('record').highlighted) {
              feature.get('record').highlighted = true;
              somethingChanged = true;
            }
          });
        }
        if (somethingChanged) {
          $timeout(() => {

          }, 0);
        }
      });
      $rootScope.$on('map.extent_changed', (e) => {
        if (!panelVisible()) {
          return;
        }
        if (mickaFilterService.filterByExtent) {
          me.queryCatalogs(me.data.datasources);
        }
      });
      map.addLayer(extentLayer);
      if (dataSourceExistsAndEmpty() && panelVisible()) {
        me.queryCatalogs(me.data.datasources);
        mickaFilterService.fillCodesets(me.data.datasources);
      }
      $rootScope.$on('core.mainpanel_changed', (event) => {
        if (dataSourceExistsAndEmpty() && panelVisible()) {
          me.queryCatalogs(me.data.datasources);
          mickaFilterService.fillCodesets(me.data.datasources);
        }
        extentLayer.setVisible(panelVisible());
      });
      if (angular.isUndefined(config.allowAddExternalDatasets)) {
        config.allowAddExternalDatasets = true;
      }
    }

    OlMap.loaded().then(init);

    return me;
  }];
