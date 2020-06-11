import '../core/core.module';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Vector} from 'ol/source';
import * as angular from 'angular';

/**
 * @namespace hs.tracking
 * @memberOf hs
 * @param config
 */
angular
  .module('hs.tracking', ['hs.map', 'hs.core'])

  /**
   * @memberof hs.tracking
   * @ngdoc directive
   * @name hs.tracking.directive
   * @description Add tracking panel html template to the map
   */
  .directive('hs.tracking.directive', [
    'HsConfig',
    function (config) {
      return {
        template: require('./partials/tracking.html'),
      };
    },
  ])

  /**
   * @memberof hs.tracking
   * @ngdoc controller
   * @name HsTrackingController
   */
  .controller(
    'HsTrackingController',
    ($scope, HsMapService, HsLayoutService) => {
      'ngInject';
      // Set the instance of the OpenAPI that s4a.js
      // works towards (by default portal.sdi4apps.eu)
      //s4a.openApiUrl('http://localhost:8080/openapi');

      // Set an alias for the namepath to the SensLog
      // module
      const SensLog = s4a.data.SensLog;

      // Assign the OpenLayers map object to a local variable
      const map = HsMapService.map;

      // Define the source of a vector layer to hold
      // routing calculataed features
      const gjSrc = new Vector();

      // Variable to hold most recent observation added to map
      let lastObservationDate = null;

      // A variable that states wheter tracking is active
      $scope.isTracking = false;

      // An arrat that holds observations
      $scope.observations = [];

      // Variable to keep track of interval execution
      let trackingInterval;

      // Define the style to apply to the routing feature layer
      const gjStyle = new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ff0000',
          width: 3,
        }),
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: '#ff0000',
          }),
        }),
      });

      // Create a re-usable vector layer with the specific
      // source and style
      const gjLyr = new VectorLayer({
        source: gjSrc,
        style: gjStyle,
      });

      /**
       * (PRIVATE) Add feature to source of vector layer
       *
       * @function addFeature
       * @memberof HsTrackingController
       * @param {type} lonLatArray
       */
      const addFeature = function (lonLatArray) {
        const feature = new Feature({
          geometry: new Point(lonLatArray),
          labelPoint: new Point(lonLatArray),
          name: 'Most recent track',
        });
        gjSrc.addFeature(feature);
      };

      /**
       * Load positions and observations from SensLog
       *
       * @function loadValues
       * @memberof HsTrackingController
       */
      const loadValues = function () {
        SensLog.getLastPosition(3, 'sdi4apps').then((res) => {
          const observationDate = SensLog.toJsDate(res.time_stamp);
          if (
            lastObservationDate === null ||
            observationDate.getTime() > lastObservationDate.getTime()
          ) {
            // Add feature to map
            addFeature([res.x, res.y]);

            // Recenter map
            map.getView().setCenter([res.x, res.y]);

            // Set last observation date
            lastObservationDate = new Date(observationDate.getTime());

            // Load sensor observations
            const therm = SensLog.getLastObservation(3, 21, 'sdi4apps');
            const rain = SensLog.getLastObservation(3, 22, 'sdi4apps');
            const speed = SensLog.getLastObservation(3, 23, 'sdi4apps');
            jQuery.when(therm, rain, speed).done((t1, p1, s1) => {
              // If more than 10 elements in array, remove first
              // before adding new
              if ($scope.observations.length >= 10) {
                $scope.observations.shift();
              }
              // Add sensor observations to array
              $scope.observations.push({
                time: SensLog.toJsDate(t1.time),
                temperature: t1.value,
                percipitation: p1.value,
                speed: s1.value,
              });

              // Digest scope if not already doing so
              if (!$scope.$$phase) {
                $scope.$digest();
              }
            });
          }
        });
      };

      /**
       * Run when clicking start tracking button, load values in defined interval
       *
       * @function startTracking
       * @memberof HsTrackingController
       */
      $scope.startTracking = function () {
        $scope.isTracking = true;
        loadValues();
        if (!$scope.$$phase) {
          $scope.$digest();
        }
        trackingInterval = setInterval(() => {
          loadValues();
          if (!$scope.$$phase) {
            $scope.$digest();
          }
        }, 5000);
      };

      /**
       * Run when clicking stop tracking button, cleans tracking
       *
       * @function stopTracking
       * @memberof HsTrackingController
       */
      $scope.stopTracking = function () {
        $scope.isTracking = false;
        clearInterval(trackingInterval);
        $scope.clearAll();
        if (!$scope.$$phase) {
          $scope.$digest();
        }
      };

      /**
       * Clears points from map and observations from table
       *
       * @function clearAll
       * @memberof HsTrackingController
       */
      $scope.clearAll = function () {
        gjSrc.clear();
        $scope.observations.length = 0;
      };

      /**
       * Function to be run when tracking is activated
       *
       * @function activate
       * @memberof HsTrackingController
       */
      $scope.activate = function () {
        map.addLayer(gjLyr);
      };

      /**
       * Function to be run when tracking is deactivated
       *
       * @function deactivate
       * @memberof HsTrackingController
       */
      $scope.deactivate = function () {
        map.removeLayer(gjLyr);
      };

      /**
       * Run the activate/deactivate functions when components
       * are activated by clicking on the side menu
       */
      $scope.$on('core.mainpanel_changed', (event) => {
        if (HsLayoutService.mainpanel === 'tracking') {
          $scope.activate();
        } else {
          $scope.deactivate();
        }
      });

      /**
       * Run the activate/deactivate functions when components
       * are loaded from static URLs
       */
      $scope.$on('scope_loaded', (event, data) => {
        if (HsLayoutService.mainpanel === 'tracking' && data === 'tracking') {
          $scope.activate();
        } else {
          $scope.deactivate();
        }
      });

      /**
       * Emit a signal when the scope is first loaded
       */
      $scope.$emit('scope_loaded', 'tracking');
    }
  );
