import {Style, Icon, Stroke, Fill, Circle} from 'ol/style';
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import {Polygon, LineString, GeometryType, Point, Circle as CircleGeom} from 'ol/geom';
import GyroNorm from '../../lib/gyronorm_updated';
import FULLTILT from 'fulltilt';
import {toRadians} from 'ol/math';
import Rotate from 'ol/control/Rotate';

export default ['hs.map.service', '$rootScope', '$log', 'Core', '$timeout', 'hs.layout.service', 'hs.utils.service',
  function (OlMap, $rootScope, $log, Core, $timeout, layoutService, utils) {
    const me = {
      /**
      * @ngdoc property
      * @name hs.geolocation.service#localization
      * @public
      * @type {Boolean} false
      * @description Represents geolocalization state (on/off)
      */
      localization: false,
      /**
      * @ngdoc property
      * @name hs.layout.service#following
      * @public
      * @type {Boolean} false
      * @description Represents geolocalization tracking option (on/off).
      * Used to deremine state of tracking in directive's html
      */
      following: false,
      gn: null,
      /**
      * @ngdoc method
      * @name hs.layout.service#stopCentering
      * @public
      * @description Turns off position centering while 'following'.
      */
      stopCentering: utils.debounce(() => {
        me.centering = false;
      }, 150),

      accuracyFeature: new Feature({known: false, geometry: new CircleGeom([0, 0], 1)}),
      positionFeature: new Feature({known: false, geometry: new Point([0, 0])}),

      /**
      * @ngdoc method
      * @name hs.geolocation.service#stopTracking
      * @public
      * @description Reset all geolocalization parameters concerning position tracking
      */
      stopTracking: function () {
        me.following = false;
        OlMap.map.getControls().getArray()[4].element.classList.add('hidden');
        OlMap.map.un('pointermove', me.stopCentering);
        me.geolocation.setTracking(false);
        me.gn.stop();
        OlMap.map.getView().setRotation(0);
      },

      /**
      * @ngdoc method
      * @name hs.geolocation.service#stopTracking
      * @public
      * @description Toggles tracking/following
      * Takes care of the distinction between click and double-click on mobile
      */
      toggleTracking: function () {
        if (me.clicked) {
          me.cancelClick = true;
          if (layoutService.sidebarBottom()) {
            layoutService.contentWrapper.querySelector('.hs-locationButton').dispatchEvent(new Event('dblclick'));
          }
          return;
        }
        me.clicked = true;
        $timeout(() => {
          if (me.cancelClick) {
            me.cancelClick = false;
            me.clicked = false;
            return;
          }
          if (me.isCentered()) {
            if (!me.following) {
              //position
              me.geolocation.on('change:position', me.setNewPosition);
              me.geolocation.setTracking(true);
              me.following = true;
              //rotation
              me.setRotation();
              me.geolocation.on('change:heading', me.newRotation);
              me.centering = true;

              OlMap.map.on('pointermove', me.stopCentering);

              OlMap.map.getControls().getArray()[4].element.classList.remove('hidden');
              layoutService.contentWrapper.querySelector('button.ol-rotate').classList.add('active');
            } 
            else {
              layoutService.contentWrapper.querySelector('button.ol-rotate').classList.remove('active');
              me.stopTracking();
            }
          } else {
            if(me.geolocation.getPosition()){
              OlMap.map.getView().setCenter(me.geolocation.getPosition());
              me.centering = true;
            }
          }

          //clean up
          me.cancelClick = false;
          me.clicked = false;
        }, 500);
      },

      /**
      * @ngdoc method
      * @name hs.geolocation.service#stopLocalization
      * @public
      * @description Reset all geolocalization parameters
      */
      stopLocalization: function () {
        me.localization = false;
        OlMap.map.removeLayer(me.position_layer);
        me.stopTracking();
      },
      /**
      * @ngdoc method
      * @name hs.geolocation.service#startLocalization
      * @public
      * @description Display current position by querying geolocation, once
      */
      startLocalization: function () {
        if (!me.localization) {
          me.geolocation.setTracking(true);
          me.localization = true;
          me.geolocation.once('change:position', () => {
            me.setNewPosition();
            OlMap.map.getView().setCenter(me.geolocation.getPosition());
            OlMap.map.addLayer(me.position_layer);
            me.position_layer.setZIndex(99);

            //stop tracking positon
            me.geolocation.setTracking(false);
          });
        }
      },

      /**
      * @ngdoc method
      * @name hs.geolocation.service#isCentered
      * @public
      * @description Function which determines whether map is centered on current postion or not
      */
      isCentered: function () {
        return angular.toJson(OlMap.map.getView().getCenter()) === angular.toJson(me.positionFeature.getGeometry().getCoordinates());

      },
      /**
      * @ngdoc method
      * @name hs.geolocation.service#setNewPosition
      * @public
      * @description Callback function handling geolocation change:position event
      */
      setNewPosition: function () {
        const position = me.geolocation.getPosition();
        me.positionFeature.getGeometry().setCoordinates(position);
        me.accuracyFeature.getGeometry().setCenterAndRadius(position, me.geolocation.getAccuracy());
        if (me.centering) {
          OlMap.map.getView().setCenter(position);
        }
      },
      /**
      * @ngdoc method
      * @name hs.geolocation.service#newRotation
      * @public
      * @description Callback function handling geolocation change:heading event
      */
      newRotation: function (e) {
        const heading = me.geolocation.getHeading() ? me.geolocation.getHeading() : null;
        if (heading) {
          OlMap.map.getView().setRotation(heading);
        }
      },

      setRotation: function () {
        const args = {
          orientationBase: GyroNorm.WORLD,		// ( Can be GyroNorm.GAME or GyroNorm.WORLD. gn.GAME returns orientation values with respect to the head direction of the device. gn.WORLD returns the orientation values with respect to the actual north direction of the world. )
          decimalCount: 4					// ( How many digits after the decimal point will there be in the return values )
        };
        me.gn = new GyroNorm();
        me.gn.FULLTILT = FULLTILT;
        me.gn.init(args).then(() => {
          me.gn.start((event) => {
            const z = toRadians(event.do.alpha);
            OlMap.map.getView().setRotation(z);
          });
        }).catch((e) => {
          console.log('error', e);
        });
      }
    };

    /**
    * @ngdoc method
    * @name hs.geolocation.service#init
    * @public
    * @description Init function of service, establish instance of geolocation object and layer.
    * Sets rotate map control.
    */
    function init() {
      me.geolocation = new Geolocation({
        projection: OlMap.map.getView().getProjection(),
        trackingOptions: {
          enableHighAccuracy: true
        }
      });

      me.accuracyFeature.setStyle(me.style);
      me.positionFeature.setStyle(me.style);

      me.position_layer = new VectorLayer({
        title: 'Position',
        show_in_manager: false,
        removable: false,
        source: new Vector()
      });
      const src = me.position_layer.getSource();

      src.addFeature(me.accuracyFeature);
      src.addFeature(me.positionFeature);
      const reset = function () {
        if (me.gn.isRunning()) {
          me.gn.stop();
          OlMap.map.getView().setRotation(0);
          layoutService.contentWrapper.querySelector('button.ol-rotate').classList.remove('active');

        } else {
          me.setRotation();
          layoutService.contentWrapper.querySelector('button.ol-rotate').classList.add('active');
        }
      };
      OlMap.map.addControl(new Rotate({
        resetNorth: reset,
        className: 'ol-rotate hidden',
        autoHide: false
      }));

    }
    OlMap.loaded().then(init);

    me.style = new Style({
      image: new Circle({
        fill: new Fill({
          color: [242, 121, 0, 0.7]
        }),
        stroke: new Stroke({
          color: [0xbb, 0x33, 0x33, 0.7]
        }),
        radius: 5
      }),
      fill: new Fill({
        color: [0xbb, 0xbb, 0xbb, 0.2]
      }),
      stroke: new Stroke({
        color: [0x66, 0x66, 0x00, 0.8]
      })
    });
    return me;
  }
];
