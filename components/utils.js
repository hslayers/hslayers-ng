/**
 * @namespace hs.map
 * @memberOf hs
 */
define(['angular', 'app'], function(angular, app) {
    angular.module('hs.utils', ['hs'])

    /**
     * @class hs.utils.service
     * @memberOf hs.utils
     * @param {object} config - Application configuration
     * @description Service for containing various utility functions
     */
    .service('hs.utils.service', ['config', function(config) {
        var me = this;

        this.escapeUrl = function(url) {
            if (url.indexOf('http') > -1 && url.indexOf(window.location.origin) == -1) {
                if (typeof use_proxy === 'undefined' || use_proxy === true) {
                    url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + encodeURIComponent(url);
                }
            }
        }

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
    }])
})
