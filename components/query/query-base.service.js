import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import {Style, Icon, Stroke, Fill, Circle} from 'ol/style';
import {Polygon, LineString, GeometryType, Point} from 'ol/geom';
import Feature from 'ol/Feature';
import {transform, transformExtent} from 'ol/proj';
import {toStringHDMS, createStringXY} from 'ol/coordinate';

export default ['$rootScope', 'hs.map.service', 'Core', '$sce', 'config',
    function ($rootScope, OlMap, Core, $sce, config) {
        var me = this;

        var map;

        this.queryPoint = new Point([0, 0]);
        this.queryLayer = new VectorLayer({
            title: "Point clicked",
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
        this.data.groups = [];
        this.data.coordinates = [];
        this.queryActive = false;
        this.popupClassname = "";
        this.selector = null;
        this.currentQuery = null;
        var dataCleared = true;

        function init() {
            map = OlMap.map;
            me.queryActive = false;
            map.on('singleclick', function (evt) {
                if (!me.queryActive) return;
                me.popupClassname = "";
                if (!dataCleared) me.clearData();
                dataCleared = false;
                me.currentQuery = (Math.random() + 1).toString(36).substring(7);
                getCoordinate(evt.coordinate);
                me.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
                $rootScope.$broadcast('queryClicked', evt);
            });
        }

        if (angular.isDefined(OlMap.map)) init();
        if (me.deregisterOnMapLoaded) me.deregisterOnMapLoaded();
        me.deregisterOnMapLoaded = $rootScope.$on('map.loaded', init);

        this.setData = function (data, type, overwrite) {
            if (angular.isDefined(type)) {
                if (angular.isDefined(overwrite) && overwrite) {
                    me.data[type].length = 0;
                }
                me.data[type].push(data);
                $rootScope.$broadcast('infopanel.updated'); //Compatibility, deprecated
                $rootScope.$broadcast('query.dataUpdated');
            }
            else if (console) console.log('Query.BaseService.setData type not passed');
        };

        this.clearData = function () {
            me.data.attributes.length = 0;
            me.data.groups.length = 0;
            me.data.coordinates.length = 0;
            var invisiblePopup = me.getInvisiblePopup();
            invisiblePopup.contentDocument.body.innerHTML = '';
            invisiblePopup.style.height = 0;
            invisiblePopup.style.width = 0;
            dataCleared = true;
        };

        this.getInvisiblePopup = function () {
            return document.getElementById('invisible_popup');
        }

        this.fillIframeAndResize = function (iframe, response, append) {
            var iframe = me.getInvisiblePopup();
            if (append)
                iframe.contentDocument.body.innerHTML += response;
            else
                iframe.contentDocument.body.innerHTML = response;
            var tmp_width = iframe.contentDocument.innerWidth;
            if (tmp_width > document.getElementById("map").clientWidth - 60) tmp_width = document.getElementById("map").clientWidth - 60;
            iframe.style.width = tmp_width + 'px';
            var tmp_height = iframe.contentDocument.innerHeight;
            if (tmp_height > 700) tmp_height = 700;
            iframe.style.height = tmp_height + 'px';
        };

        function getCoordinate(coordinate) {
            me.queryPoint.setCoordinates(coordinate, 'XY');
            var coords = {
                name: "Coordinates",
                projections: [{
                    "name": "EPSG:4326",
                    "value": toStringHDMS(transform(coordinate, map.getView().getProjection(), 'EPSG:4326'))
                }, {
                    "name": map.getView().getProjection().getCode(),
                    "value": createStringXY(7)(coordinate)
                }]
            };
            me.setData(coords, 'coordinates', true);
            if (!$rootScope.$$phase) $rootScope.$digest();
        }

        this.activateQueries = function () {
            me.queryActive = true;
            map.addLayer(me.queryLayer);
            $rootScope.$broadcast('queryStatusChanged');
        };
        this.deactivateQueries = function () {
            me.queryActive = false;
            map.removeLayer(me.queryLayer);
            $rootScope.$broadcast('queryStatusChanged');
        };

        function pointClickedStyle(feature) {
            var defaultStyle = new Style({
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
                if (config.queryPoint == "hidden") {
                    defaultStyle.getImage().setRadius(0);
                }
                else if (config.queryPoint == "notWithin") {
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
        me.deregisterVectorSelectorCreated = $rootScope.$on('vectorSelectorCreated', function (e, selector) {
            me.selector = selector;
        });
    }]