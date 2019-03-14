/**
 * @ngdoc module
 * @module hs.utils
 * @name hs.utils
 * @description Utility module which contains few utility functions.
 */
define(['angular', 'app', 'ol'], function (angular, app, ol) {
    angular.module('hs.utils', ['hs'])

        /**
         * @ngdoc service
         * @name hs.utils.service
         * @module hs.utils
         * @param {object} config - Application configuration
         * @description Service for containing various utility functions used throughout HSL modules. 
         * Add few utility functions and also enrich some data types with additional functions (mainly Date and String).
         */
        .service('hs.utils.service', ['config', function (config) {
            var me = this;
            /**
            * @ngdoc method
            * @name hs.utils.service#proxify
            * @public
            * @param {String} url Url to proxify
            * @param {Boolean} toEncoding Optional parameter if UTF-8 encoding shouldn´t be used for non-image Urls.         
            * @returns {String} Encoded Url with path to hsproxy.cgi script  
            * @description Add path to proxy cgi script (hsproxy.cgi) into Url and encode rest of Url if valid http Url is send and proxy use is allowed.
            */
            this.proxify = function (url, toEncoding) {
                toEncoding = angular.isUndefined(toEncoding) ? true : toEncoding;
                var outUrl = url;
                if ((url.substring(0, 4) == 'http' && url.indexOf(window.location.origin) == -1) || getPortFromUrl(url) != window.location.port) {
                    if (typeof use_proxy === 'undefined' || use_proxy === true) {

                        outUrl = config.proxyPrefix || "/cgi-bin/hsproxy.cgi?";
                        if (toEncoding && (url.indexOf('GetMap') == -1 || url.indexOf('GetFeatureInfo') > -1)) outUrl += "toEncoding=utf-8&";
                        outUrl = outUrl + "url=" + encodeURIComponent(url);
                    }
                }
                return outUrl;
            }


            /**
            * @ngdoc method
            * @name hs.utils.service#shortUrl
            * @public
            * @param {String} url Url to shorten
            * @returns {String} Shortened url
            * @description Promise which shortens url by using some url shortener. 
            * By default tinyurl is used, but user provided function in config.shortenUrl can be used. Example: function(url) {
                    return new Promise(function(resolve, reject){
                        $http.get("http://tinyurl.com/api-create.php?url=" + url, {
                            longUrl: url
                        }).success(function(data, status, headers, config) {
                            resolve(data);
                        }).error(function(data, status, headers, config) {
                            reject()
                        })
                    })
                }
            */
            this.shortUrl = function (url) {
                if (config.shortenUrl) return config.shortenUrl(url);
                return new Promise(function (resolve, reject) {
                    $http.get(me.proxify("http://tinyurl.com/api-create.php?url=" + url), {
                        longUrl: url
                    }).success(function (data, status, headers, config) {
                        resolve(data);
                    }).error(function (data, status, headers, config) {
                        reject()
                    })
                })
            }

            /**
            * @ngdoc method
            * @name hs.utils.service#getPortFromUrl
            * @private
            * @param {String} url Url for which to determine port number        
            * @returns {String} Port number  
            */
            function getPortFromUrl(url) {
                var link = document.createElement('a');
                link.setAttribute('href', url);
                return link.port;
            }
            /**
            * @ngdoc method
            * @name hs.utils.service#parseHexString
            * @deprecated
            */
            this.parseHexString = function (hex) {
                for (var bytes = [], c = 0; c < hex.length; c += 2)
                    bytes.push(parseInt(hex.substr(c, 2), 16));
                return bytes;
            }
            /**
            * @ngdoc method
            * @name hs.utils.service#createHexString
            * @deprecated
            */
            this.createHexString = function (bytes) {
                for (var hex = [], i = 0; i < bytes.length; i++) {
                    hex.push((bytes[i] >>> 4).toString(16));
                    hex.push((bytes[i] & 0xF).toString(16));
                }
                return hex.join("");
            }
            /**
            * @ngdoc method
            * @name hs.utils.service#getParamsFromUrl
            * @public
            * @param {String} str Url to parse for parameters 
            * @returns {Object} Object with parsed parameters as properties
            * @description Parse parameters and their values from Url string
            */
            this.getParamsFromUrl = function (str) {
                if (typeof str !== 'string') {
                    return {};
                }

                if (str.indexOf('?') > -1)
                    str = str.substring(str.indexOf("?") + 1);
                else
                    return {};

                return str.trim().split('&').reduce(function (ret, param) {
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
            * @ngdoc method
            * @name hs.utils.service#paramsToUrl
            * @public
            * @param {Object} array Parameter object with parameter key-value pairs 
            * @returns {String} Joined encoded Url query string
            * @description Create encoded Url string from object with parameters
            */
            this.paramsToURL = function (array) {
                var pairs = [];
                for (var key in array)
                    if (array.hasOwnProperty(key))

                        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(array[key]));
                return pairs.join('&');
            }
            /**
            * @ngdoc method
            * @name hs.utils.service#paramsToUrlWoEncode
            * @public
            * @param {Object} array Parameter object with parameter key-value pairs 
            * @returns {String} Joined Url query string
            * @description Create Url string from object with parameters without encoding
            */
            this.paramsToURLWoEncode = function (array) {
                var pairs = [];
                for (var key in array)
                    if (array.hasOwnProperty(key))

                        pairs.push(key + '=' + array[key]);
                return pairs.join('&');
            }
            /**
            * @ngdoc method
            * @name hs.utils.service#generateUuid
            * @public        
            * @returns {String} Random uuid
            * @description Generate randomized uuid
            */
            this.generateUuid = function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : r & 0x3 | 0x8;
                    return v.toString(16);
                });
            }

            /**
            * @ngdoc method
            * @name hs.utils.service#rainbow
            * @public        
            * @returns {String} CSS color
            * @description Generates css color string (rgba(0, 0, 0, 1)) from given range and value for which to have color
            */
            this.rainbow = function (numOfSteps, step, opacity) {
                // based on http://stackoverflow.com/a/7419630
                // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
                // Adam Cole, 2011-Sept-14
                // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
                var r, g, b;
                var h = step / (numOfSteps * 1.00000001);
                var i = ~~(h * 4);
                var f = h * 4 - i;
                var q = 1 - f;
                switch (i % 4) {
                    case 2:
                        r = f, g = 1, b = 0;
                        break;
                    case 0:
                        r = 0, g = f, b = 1;
                        break;
                    case 3:
                        r = 1, g = q, b = 0;
                        break;
                    case 1:
                        r = 0, g = 1, b = q;
                        break;
                }
                var c = "rgba(" + ~~(r * 235) + "," + ~~(g * 235) + "," + ~~(b * 235) + ", " + opacity + ")";
                return (c);
            }

            Date.isLeapYear = function (year) {
                return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
            };

            Date.getDaysInMonth = function (year, month) {
                return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
            };

            Date.prototype.isLeapYear = function () {
                return Date.isLeapYear(this.getFullYear());
            };

            Date.prototype.getDaysInMonth = function () {
                return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
            };

            Date.prototype.addMonths = function (value) {
                var n = this.getDate();
                this.setDate(1);
                this.setMonth(this.getMonth() + value);
                this.setDate(Math.min(n, this.getDaysInMonth()));
                return this;
            };

            Date.prototype.monthDiff = function (d2) {
                var months;
                months = (d2.getFullYear() - this.getFullYear()) * 12;
                months -= this.getMonth() + 1;
                months += d2.getMonth();
                return months <= 0 ? 0 : months;
            }

            String.prototype.hashCode = function () {
                var hash = 0;
                if (this.length == 0) return hash;
                for (i = 0; i < this.length; i++) {
                    char = this.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return hash;
            }

            String.prototype.replaceAll = function (search, replacement) {
                var target = this;
                return target.replace(new RegExp(search, 'g'), replacement);
            };


            if (!String.prototype.format) {
                String.prototype.format = function () {
                    var args = arguments;
                    return this.replace(/{(\d+)}/g, function (match, number) {
                        return typeof args[number] != 'undefined' ?
                            args[number] :
                            match;
                    });
                };
            }

            if (!String.prototype.capitalizeFirstLetter) {
                String.prototype.capitalizeFirstLetter = function () {
                    return this.charAt(0).toUpperCase() + this.slice(1);
                }
            }

        }])

        /**
         * @ngdoc service
         * @name hs.utils.layerUtilsService
         * @module hs.utils
         * @param {object} config - Application configuration
         * @description Service containing varius functions for testing layer functionalities
         */
        .service('hs.utils.layerUtilsService', ['config', function (config) {
            var me = this;

            /**
             * @ngdoc method
             * @name hs.utils.layerUtilsService#layerIsZoomable
             * @param {Ol.layer} layer Selected layer
             * @returns {Boolean} True for layer with BoundingBox property, for WMS layer or for layer, which has source with extent
             * @description Determines if layer have properties needed for Zoom to layer function.
             */
            this.layerIsZoomable = function (layer) {
                if (typeof layer == 'undefined') return false;
                if (layer.get("BoundingBox")) return true;
                if (me.isLayerWMS(layer)) return true;
                if (layer.getSource().getExtent && layer.getSource().getExtent() && !ol.extent.isEmpty(layer.getSource().getExtent())) return true;
                return false;
            }

            /**
             * @ngdoc method
             * @name hs.utils.layerUtilsService#layerIsStyleable
             * @param {Ol.layer} layer Selected layer
             * @returns {Boolean} True for ol.layer.Vector 
             * @description Determines if layer is a Vector layer and therefore styleable
             */
            this.layerIsStyleable = function (layer) {
                if (typeof layer == 'undefined') return false;
                if (layer instanceof ol.layer.Vector /*&& layer.getSource().styleAble*/) return true;
                return false;
            }

            /**
             * @ngdoc method
             * @name hs.utils.layerUtilsService#isLayerQueryable
             * @param {Ol.layer} layer Selected layer
             * @returns {Boolean} True for ol.layer.Tile and ol.layer.Image with INFO_FORMAT in params
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
             * @ngdoc method
             * @name hs.utils.layerUtilsService#isLayerWMS
             * @param {Ol.layer} layer Selected layer
             * @returns {Boolean} True for ol.layer.Tile and ol.layer.Image
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
             * @ngdoc method
             * @name hs.utils.layerUtilsService#layerLoaded
             * @param {Ol.layer} layer Selected layer
             * @returns {Boolean} True loaded / False not (fully) loaded
             * @description Test if layers source is loaded 
             */
            this.layerLoaded = function (layer) {
                return layer.getSource().loaded
            }

            /**
             * @ngdoc method
             * @name hs.utils.layerUtilsService#layerInvalid
             * @param {Ol.layer} layer Selected layer
             * @returns {Boolean} True invalid, false valid source
             * @description Test if layers source is validly loaded (!true for invalid)
             */
            this.layerInvalid = function (layer) {
                return layer.getSource().error;
            }


        }])
})
