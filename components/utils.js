/**
 * @namespace hs.map
 * @memberOf hs
 */
define(['angular', 'app'], function(angular, app) {
    angular.module('hs.utils', ['hs'])

    /**
     * @ngdoc service
     * @name hs.utils.service
     * @memberOf hs.utils
     * @param {object} config - Application configuration
     * @description Service for containing various utility functions
     */
    .service('hs.utils.service', ['config', function(config) {
        var me = this;

        /**
        * @function proxify
        * @memberof hs.utils.service
        * @params {String} url Url to proxify
        * @params {Boolean} toEncoding Optional parameter if UTF-8 encoding shouldn´t be used for non-image Urls.         
        * @returns {String} Encoded Url with path to script 
        * Add path to proxy cgi script (hsproxy.cgi) into Url and encode rest of Url if valid http Url is send and proxy use is allowed.
        */
        this.proxify = function(url, toEncoding) {
            toEncoding = angular.isUndefined(toEncoding) ? true : toEncoding;
            var outUrl = url;
            if ((url.substring(0, 4) == 'http' && url.indexOf(window.location.origin) == -1) || getPortFromUrl(url) != window.location.port) {
                if (typeof use_proxy === 'undefined' || use_proxy === true) {

                    outUrl = "/cgi-bin/hsproxy.cgi?";
                    if (toEncoding && url.indexOf('FORMAT=image') == -1) outUrl += "toEncoding=utf-8&";
                    outUrl = outUrl + "url=" + encodeURIComponent(url);
                }
            }
            return outUrl;
        }

         /**
        * @function getPortFromUrl
        * @memberof hs.utils.service
        * @params {String} url Url for which to determine port number 
        * @returns {String} 
        */
        function getPortFromUrl(url){
            var link = document.createElement('a');
            link.setAttribute('href', url);
            return link.port;
        }

        /**
        * @function parseXexString
        * @memberof hs.utils.service
        * @params {String} hex 
        * @returns {Array} 
        * DEPRECATED?
        */
        this.parseHexString = function(hex) {
            for (var bytes = [], c = 0; c < hex.length; c += 2)
                bytes.push(parseInt(hex.substr(c, 2), 16));
            return bytes;
        }

        /**
        * @function createHexString
        * @memberof hs.utils.service
        * @params {Array} bytes 
        * @returns {String} 
        * DEPRECATED?
        */
        this.createHexString = function(bytes) {
            for (var hex = [], i = 0; i < bytes.length; i++) {
                hex.push((bytes[i] >>> 4).toString(16));
                hex.push((bytes[i] & 0xF).toString(16));
            }
            return hex.join("");
        }

        /**
        * @function getParamsFromUrl
        * @memberof hs.utils.service
        * @params {String} str Url to parse for paramameters 
        * @returns {Object} Object with parameter key-value pairs 
        * Parse parameters and their values from Url string with Querry string
        */
        this.getParamsFromUrl = function(str) {
            if (typeof str !== 'string') {
                return {};
            }

            if (str.indexOf('?') > -1)
                str = str.substring(str.indexOf("?") + 1);
            else
                return {};

            return str.trim().split('&').reduce(function(ret, param) {
                var parts = param.replace(/\+/g, ' ').split('=');
                var key = parts[0];
                var val = parts[1];

                key = decodeURIComponent(key);
                // missing `=` should be `null`:
                // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
                val = val === undefined ? null : decodeURIComponent(val);

                if (!ret.hasOwnProperty(key)) {
                    ret[key] = val;
                } else if (Array.isArray(ret[key])) {
                    ret[key].push(val);
                } else {
                    ret[key] = [ret[key], val];
                }

                return ret;
            }, {});
        };

        /**
        * @function paramsToUrl
        * @memberof hs.utils.service
        * @params {Object} array Parameter object with parameter key-value pairs 
        * @returns {String} Joined encoded Url query string
        * Create encoded Url string from Parameter array
        */
        this.paramsToURL = function(array) {
            var pairs = [];
            for (var key in array)
                if (array.hasOwnProperty(key))

                    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(array[key]));
            return pairs.join('&');
        }
        
        /**
        * @function paramsToUrl
        * @memberof hs.utils.service
        * @params {Object} array Parameter object with parameter key-value pairs 
        * @returns {String} Joined encoded Url query string
        * Create encoded Url string from Parameter array
        */
        this.paramsToURLWoEncode = function(array) {
            var pairs = [];
            for (var key in array)
                if (array.hasOwnProperty(key))

                    pairs.push(key + '=' + array[key]);
            return pairs.join('&');
        }

        /**
        * @function generateUuid
        * @memberof hs.utils.service
        * @returns {String} Random uuid 
        * Generate randomized uuid
        */
        this.generateUuid = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : r & 0x3 | 0x8;
                return v.toString(16);
            });
        }

        Date.isLeapYear = function(year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
        };

        Date.getDaysInMonth = function(year, month) {
            return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        };

        Date.prototype.isLeapYear = function() {
            return Date.isLeapYear(this.getFullYear());
        };

        Date.prototype.getDaysInMonth = function() {
            return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
        };

        Date.prototype.addMonths = function(value) {
            var n = this.getDate();
            this.setDate(1);
            this.setMonth(this.getMonth() + value);
            this.setDate(Math.min(n, this.getDaysInMonth()));
            return this;
        };

        Date.prototype.monthDiff = function(d2) {
            var months;
            months = (d2.getFullYear() - this.getFullYear()) * 12;
            months -= this.getMonth() + 1;
            months += d2.getMonth();
            return months <= 0 ? 0 : months;
        }

        String.prototype.hashCode = function() {
            var hash = 0;
            if (this.length == 0) return hash;
            for (i = 0; i < this.length; i++) {
                char = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        }

        String.prototype.replaceAll = function(search, replacement) {
            var target = this;
            return target.replace(new RegExp(search, 'g'), replacement);
        };


        if (!String.prototype.format) {
            String.prototype.format = function() {
                var args = arguments;
                return this.replace(/{(\d+)}/g, function(match, number) {
                    return typeof args[number] != 'undefined' ?
                        args[number] :
                        match;
                });
            };
        }

        if (!String.prototype.capitalizeFirstLetter) {
            String.prototype.capitalizeFirstLetter = function() {
                return this.charAt(0).toUpperCase() + this.slice(1);
            }
        }
        
    }])
    
    /**
     * @ngdoc service
     * @name hs.utils.layerUtilsService
     * @memberOf hs.utils
     * @param {object} config - Application configuration
     * @description Service containing varius functions for testing layer functionalities
     */
    .service('hs.utils.layerUtilsService', ['config', function(config) {
        var me = this;
        
        /**
         * @function layerIsZoomable
         * @memberOf hs.utils.layerUtilsService
         * @description Determines if layer has BoundingBox defined as its metadata or is a Vector layer.
         * @param {Ol.layer} layer Selected layer
         */
        this.layerIsZoomable = function (layer) {
            if (typeof layer == 'undefined') return false;
            if (layer.get("BoundingBox")) return true;
            if (me.isLayerWMS(layer)) return true;
            if (layer.getSource().getExtent && layer.getSource().getExtent() && !ol.extent.isEmpty(layer.getSource().getExtent())) return true;
            return false;
        }

        /**
         * @function layerIsStyleable
         * @memberOf hs.utils.layerUtilsService
         * @description Determines if layer is a Vector layer and therefore styleable
         * @param {Ol.layer} layer Selected layer
         */
        this.layerIsStyleable = function (layer) {
            if (typeof layer == 'undefined') return false;
            if (layer instanceof ol.layer.Vector /*&& layer.getSource().styleAble*/ ) return true;
            return false;
        }

        /**
         * @function isLayerQueryable
         * @memberOf hs.utils.layerUtilsService
         * @param {Ol.layer} layer Selected layer
         * @description Test if layer is queryable (WMS layer with Info format)
         */
        this.isLayerQueryable = function (layer) {
            if (layer instanceof ol.layer.Tile &&
                (layer.getSource() instanceof ol.source.TileWMS) &&
                layer.getSource().getParams().INFO_FORMAT) return true;
            if (layer instanceof ol.layer.Image &&
                layer.getSource() instanceof ol.source.ImageWMS &&
                layer.getSource().getParams().INFO_FORMAT) return true;
            return false;
        }
        /**
         * @function isLayerWMS
         * @memberOf hs.utils.layerUtilsService
         * @param {Ol.layer} layer Selected layer
         * @description Test if layer is WMS layer
         */
        this.isLayerWMS = function (layer) {
            if (layer instanceof ol.layer.Tile &&
                (layer.getSource() instanceof ol.source.TileWMS)) return true;
            if (layer instanceof ol.layer.Image &&
                layer.getSource() instanceof ol.source.ImageWMS) return true;
            return false;
        }

        /**
         * @function layerLoaded
         * @memberOf hs.utils.layerUtilsService
         * @param {Ol.layer} layer Selected layer
         * @description Test if selected layer is loaded in map
         */
        this.layerLoaded = function (layer) {
            return layer.getSource().loaded
        }
        
        /**
         * @function layerInvalid
         * @memberOf hs.utils.layerUtilsService
         * @param {Ol.layer} layer Selected layer
         * @description Test if selected layer is not invalid (true for invalid)
         */
        this.layerInvalid = function (layer) {
            return layer.getSource().error;
        }
            
        
    }])
})
