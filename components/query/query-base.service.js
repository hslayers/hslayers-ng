import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { transform, transformExtent } from 'ol/proj';
import { toStringHDMS, createStringXY } from 'ol/coordinate';

export default ['$rootScope', 'hs.map.service', 'Core', '$sce', 'config', 'hs.layout.service',
    function ($rootScope, OlMap, Core, $sce, config, layoutService) {
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
        this.data.features = [];
        this.data.featureInfoHtmls = [];
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
                $rootScope.$broadcast('mapClicked', angular.extend(evt, {
                    coordinates: getCoordinate(evt.coordinate)
                }));
                if (!me.queryActive) return;
                me.popupClassname = "";
                if (!dataCleared) me.clearData();
                dataCleared = false;
                me.currentQuery = (Math.random() + 1).toString(36).substring(7);
                me.setData(getCoordinate(evt.coordinate), 'coordinates', true);
                if (!$rootScope.$$phase) $rootScope.$digest();
                me.last_coordinate_clicked = evt.coordinate; //It is used in some examples and apps
                $rootScope.$broadcast('mapQueryStarted', evt);
            });
            $rootScope.$watch(() => layoutService.sidebarExpanded, () => {
                if (layoutService.sidebarExpanded && me.currentPanelQueryable()) {
                    if (!me.queryActive) me.activateQueries();
                } else {
                    if (me.queryActive) me.deactivateQueries();
                }
            })
        }

        OlMap.loaded().then(init);

        this.setData = function (data, type, overwrite) {
            if (angular.isDefined(type)) {
                if (angular.isDefined(overwrite) && overwrite) {
                    me.data[type].length = 0;
                }
                if (Array.isArray(data))
                    me.data[type] = me.data[type].concat(data);
                else
                    me.data[type].push(data);
                $rootScope.$broadcast('infopanel.updated'); //Compatibility, deprecated
                $rootScope.$broadcast('query.dataUpdated', me.data);
            }
            else if (console) console.log('Query.BaseService.setData type not passed');
        };

        this.clearData = function (type) {
            if (type) {
                me.data[type].length = 0;
            } else {
                me.data.attributes.length = 0;
                me.data.features = [];
                me.data.coordinates.length = 0;
                me.data.featureInfoHtmls = [];
            }
            var invisiblePopup = me.getInvisiblePopup();
            invisiblePopup.contentDocument.body.innerHTML = '';
            invisiblePopup.style.height = 0;
            invisiblePopup.style.width = 0;
            dataCleared = true;
        };

        this.getInvisiblePopup = function () {
            return document.getElementById('invisible_popup');
        }

        this.pushFeatureInfoHtml = (html) => {
            me.data.featureInfoHtmls.push($sce.trustAsHtml(html));
            dataCleared = false;
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
            var epsg4326Coordinate = transform(coordinate,
                map.getView().getProjection(), 'EPSG:4326'
            );
            var coords = {
                name: "Coordinates",
                mapProjCoordinate: coordinate,
                epsg4326Coordinate,
                projections: [{
                    "name": "EPSG:4326",
                    "value": toStringHDMS(epsg4326Coordinate)
                },
                {
                    "name": "EPSG:4326",
                    "value": createStringXY(7)(epsg4326Coordinate)
                }, {
                    "name": map.getView().getProjection().getCode(),
                    "value": createStringXY(7)(coordinate)
                }]
            };
          return coords
        }

        this.activateQueries = function () {
            if (me.queryActive) return;
            me.queryActive = true;
            OlMap.loaded().then(map => {
                map.addLayer(me.queryLayer);
                $rootScope.$broadcast('queryStatusChanged', true);
            });
        };
        this.deactivateQueries = function () {
            if (!me.queryActive) return;
            me.queryActive = false;
            OlMap.loaded().then(map => {
                map.removeLayer(me.queryLayer);
                $rootScope.$broadcast('queryStatusChanged', false);
            })
        };

        this.currentPanelQueryable = function () {
            let nonQueryablePanels = ['measure', 'compositions', 'analysis', 'sensors'];
            return (nonQueryablePanels.indexOf(layoutService.mainpanel) == -1)
        }

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