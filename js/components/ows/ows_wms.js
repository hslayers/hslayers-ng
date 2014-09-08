angular.module('hs.ows.wms', [])
    //This is used to share map object between components.
    .service("OwsWmsCapabilities", ['$http',
        function($http) {
            this.requestGetCapabilities = function(service_url) {
                var url = window.escape(service_url + "?request=GetCapabilities&service=WMS");
                $http.get("/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url).success(this.capabilitiesReceived);
            };

        }
    ])
    .controller('OwsWms', ['$scope', 'OlMap', 'OwsWmsCapabilities',
        function($scope, OlMap, OwsWmsCapabilities) {
            OwsWmsCapabilities.capabilitiesReceived = function(response) {
                try {
                    var parser = new ol.format.WMSCapabilities();
                    $scope.capabilities = parser.read(response);
                    var caps = $scope.capabilities;
                    $scope.title = caps.Service.Title;
                    $scope.description = addAnchors(caps.Service.Abstract);
                    $scope.version = caps.Version;
                    $scope.image_formats = caps.Capability.Request.GetMap.Format;
                    $scope.query_formats = (caps.Capability.Request.GetFeatureInfo ? caps.Capability.Request.GetFeatureInfo.Format : []);
                    $scope.exceptions = caps.Capability.Exception;
                    $scope.srss = caps.Capability.Layer.CRS;
                    $scope.services = caps.Capability.Layer;
                    $scope.getMapUrl = caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource;
                    $scope.image_format = getPreferedFormat($scope.image_formats, ["image/png", "image/gif", "image/jpeg"]);
                    $scope.query_format = getPreferedFormat($scope.query_formats, ["application/vnd.esri.wms_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wms_xml", "text/plain", "text/html"]);
                } catch (e) {
                    console.log(e);
                    /* Ext.MessageBox.show({
                                title: OpenLayers.i18n('WMS Capabilities parsing problem'),
                                msg: OpenLayers.i18n('There was error while parsing Capabilities response from given URL')+":<br />\n"+ e,
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.ERROR});
                        throw "WMS Capabilities parsing problem";*/
                }
            }

            $scope.addLayers = function(checked) {
                angular.forEach($scope.services.Layer, function(value, key) {
                    if (!checked || value.checked)
                        addLayer(
                            value,
                            value.Title.replace(/\//g, "&#47;"),
                            $scope.folder_name,
                            $scope.image_format,
                            $scope.query_format,
                            $scope.single_tile,
                            $scope.tile_size,
                            $scope.srs
                        );
                })
            };

            /**
             * add selected layer to map
             * @param {Object} layer capabilities layer object
             * @param {String} layerName layer name in the map
             * @param {String} folder name
             * @param {String} imageFormat
             * @param {String} queryFormat
             * @param {Boolean} singleTile
             * @param {OpenLayers.Size} tileSize
             * @param {OpenLayers.Projection} crs of the layer
             * @function
             * @name addLayer
             */
            var addLayer = function(layer, layerName, folder, imageFormat, queryFormat, singleTile, tileSize, crs) {
                console.log(layer);
                /*
            var layerCrs = (typeof(OlMap.map.projection) == typeof("") ? OlMap.map.projection.toUpperCase() : OlMap.map.projection.getCode().toUpperCase());

            var options = {
                    layers: layer.name,
                    transparent: (imageFormat.search("png") > -1 || imageFormat.search("gif") > -1 ? "TRUE" : "FALSE"),
                    format: imageFormat,
                    EXCEPTIONS: "application/vnd.ogc.se_inimage", //application/vnd.ogc.se_xml",
                    VERSION: this.version,
                    INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
                    styles: layer.styles.length > 0 ? layer.styles[0].name : undefined
                };

            var maxExtent;
            var layerbbox = null;


            if (layer.llbbox) {
                layerbbox = layer;

                prj = new OpenLayers.Projection("epsg:4326");
                // NOT in 'common' form minx, miny, maxx, maxy, but
                // miny, minx, maxy, maxx
                // FIXME - you never know :-(
                // 1.3.0
                // 0: "48.1524"
                // 1: "12.7353"
                // 2: "51.3809"
                // 3: "17.1419"
                maxExtent = new OpenLayers.Bounds(layerbbox.llbbox[0],
                                                  layerbbox.llbbox[1],
                                                  layerbbox.llbbox[2],
                                                  layerbbox.llbbox[3]);

                var mapBounds = OlMap.map.getMaxExtent().clone();
                mapBounds.transform(OlMap.map.getProjectionObject(), prj);

                // fix sizes
                maxExtent.left = (maxExtent.left < mapBounds.left ? mapBounds.left : maxExtent.left);
                maxExtent.bottom = (maxExtent.bottom < mapBounds.bottom ? mapBounds.bottom : maxExtent.bottom);
                maxExtent.right = (maxExtent.right > mapBounds.right ? mapBounds.right : maxExtent.right);
                maxExtent.top = (maxExtent.top > mapBounds.top ? mapBounds.top : maxExtent.top);

                if (maxExtent.containsBounds(mapBounds)) {
                    maxExtent = OlMap.map.getMaxExtent().clone();
                }
                else {
                    maxExtent.transform(prj, OlMap.map.getProjectionObject());
                }
            }

            switch(this.version) {
                case "1.3.0":
                    options.CRS = layerCrs;
                    options.EXCEPTIONS =  "XML";
                    break;
                default:
                    options.SRS = layerCrs;
                    break;
            }

            var projections = [];

            for (var j in this.srss) {
                var prj;
                try {
                    prj = HSLayers.OWS._Projections[j.toUpperCase()];
                    if (!prj) {
                        prj = new OpenLayers.Projection(j);
                        HSLayers.OWS._Projections[j.toUpperCase()] = prj;
                    }
                    if (prj.proj.readyToUse) {
                        projections.push(prj);
                    }
                }
                catch(e){OpenLayers.Console.log(e);}
            }

            // HACK HACK HACK
            // min and max scale is sometimes parsed in wrong way
            layer.minScale = parseFloat(layer.minScale);
            layer.maxScale = parseFloat(layer.maxScale);
            if (layer.minScale && layer.maxScale && (layer.minScale < layer.maxScale)) {
                var mins = layer.minScale;
                layer.minScale = layer.maxScale;
                layer.maxScale = mins;
            }
            // /HACK HACK HACK


            var minResolution =  (layer.maxScale ? OpenLayers.Util.getResolutionFromScale(layer.maxScale,OlMap.map.baseLayer.units) :
                            OlMap.map.baseLayer.resolutions[OlMap.map.baseLayer.resolutions.length-1]);
            var maxResolution = (layer.minScale ? OpenLayers.Util.getResolutionFromScale(layer.minScale,OlMap.map.baseLayer.units) :
                            OlMap.map.baseLayer.resolutions[0]);

            if (minResolution == Infinity) {
                minResolution = undefined;
                layer.maxScale = undefined;
            }

            if (maxResolution == Infinity) {
                maxResolution = undefined;
                layer.minScale = undefined;
            }

            var obj = {
                formats: []
            };
            layer.formats.map(function(format) {this.formats.push({value: format});},obj);

            var metadataURL = this.getLayerMetadataUrl(layer);
            var layerName = layerName.replace(/\//g,"&#47");
            var params = {
                    isBaseLayer: false,
                    title: layerName,
                    visibility:true,
                    transitionEffect: "resize",
                    singleTile: singleTile,
                    tileSize: tileSize, //|| new OpenLayers.Size(OpenLayers.Map.TILE_WIDTH, OpenLayers.Map.TILE_HEIGHT),
                    abstract: layer.abstract,
                    metadata: {
                        styles: layer.styles,
                        formats: obj.formats
                    },
                    saveWMC: true,
                    path: folder,
                    metadataURL: metadataURL,
                    buffer: 1,
                    ratio: 1,
                    maxExtent: maxExtent,
                    projections: projections,
                    projection: new OpenLayers.Projection(crs),
                    queryable: layer.queryable,
                    wmsMinScale: layer.minScale,
                    wmsMaxScale: layer.maxScale,
                    minResolution: minResolution,
                    maxResolution: maxResolution,
                    dimensions: layer.dimensions,
                    capabilitiesURL: $scope.capabilities.Capability.Request.GetCapabilities.DCPType[0].HTTP.Get.OnlineResource,
                    removable:true
                };

            options.owsService = "WMS";
            //options.owsUrl = this.getMapUrl.href;
            options.fromCRS = crs;

            // unique layer name
            //layerName = this.getUniqueLayerName(layerName);
            var source = new ol.source.TileWMS({
      url: $scope.getMapUrl,
      crossOrigin: 'anonymous',
      attributions: [new ol.Attribution({
        html: layer.attribution
      })],
      params: params,
    }); */
                var new_layer = new ol.layer.Tile({
                    title: layerName,
                    source: new ol.source.TileWMS({
                        url: $scope.getMapUrl,
                        attributions: [new ol.Attribution({
                            html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                        })],
                        params: {
                            LAYERS: layer.Name,
                            INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
                        },
                    })
                });

                OlMap.map.addLayer(new_layer);
            }

            var getPreferedFormat = function(formats, preferedFormats) {
                for (i = 0; i < preferedFormats.length; i++) {
                    if (formats.indexOf(preferedFormats[i]) > -1) {
                        return (preferedFormats[i]);
                    }
                }
                return formats[0];
            }

            var addAnchors = function(url) {
                if (!url) return null;
                var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                return url.replace(exp, "<a href='$1'>$1</a>");
            }
        }
    ]);