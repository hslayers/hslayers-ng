import { WKT, GeoJSON, GML } from 'ol/format';
import { transform, transformExtent, get as getProj } from 'ol/proj';
import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { Vector } from 'ol/source';
import * as loadingstrategy from 'ol/loadingstrategy';

export default function (options) {
    if (typeof options.version == 'undefined') options.version = '1.0.0';
    if (typeof options.hsproxy == 'undefined') options.hsproxy = true;
    if (typeof options.format == 'undefined') options.format = new GeoJSON();
    options.projection = options.projection.toUpperCase();
    if (typeof options.parser == 'undefined') options.parser = function (response) {
        var features = [];
        var gm = new GML();
        for (var key in gm) {
            if (key.indexOf("_PARSERS") > 0)
                gm[key]["http://www.opengis.net/gml/3.2"] = gm[key]["http://www.opengis.net/gml"];
        }
        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString(response, "application/xml");
        var doc = oDOM.documentElement;
        doc.querySelectorAll('member').forEach(function () {
            var attrs = {};
            var geom_node = this.querySelector("geometry") || this.querySelector("CP\\:geometry");
            attrs.geometry = gm.readGeometryElement(geom_node, [{}]);
            var feature = new Feature(attrs);
            features.push(feature);
        });
        return features;
    }

    var src = new Vector({
        format: options.format,
        loader: function (extent, resolution, projection) {
            this.set('loaded', false);
            this.clear();
            if (console) console.log("resolution", resolution);
            var p = options.url + (options.url.indexOf('?') > 0 ? '&' : '?') +
                'service=WFS&TYPENAME=' + options.typename + '&request=GetFeature&' +
                'version=' + options.version + '&' +
                'SRSNAME=' + options.projection + '&outputFormat=geojson&' +
                'bbox=' + extent.join(',') + ',urn:ogc:def:crs:EPSG:6.3:3857';
            var url = options.hsproxy ? "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape(p) : p;
            var $injector = angular.injector(['ng']);
            var $http = $injector.get('$http');

            $http.get(url)
                .then(response => {
                    this.addFeatures(options.parser(response));
                    this.hasLine = false;
                    this.hasPoly = false;
                    this.hasPoint = false;
                    angular.forEach(this.getFeatures(), function (f) {
                        if (f.getGeometry()) {
                            switch (f.getGeometry().getType()) {
                                case 'LineString' || 'MultiLineString':
                                    this.hasLine = true;
                                    break;
                                case 'Polygon' || 'MultiPolygon':
                                    this.hasPoly = true;
                                    break;
                                case 'Point' || 'MultiPoint':
                                    this.hasPoint = true;
                                    break;
                            }
                        }
                    })

                    if (this.hasLine || this.hasPoly || this.hasPoint) {
                        this.styleAble = true;
                    }
                    this.set('loaded', true);
                });
        },
        projection: options.projection,
        strategy: loadingstrategy.bbox
    });
    src.defOptions = options;
    return src;
};
