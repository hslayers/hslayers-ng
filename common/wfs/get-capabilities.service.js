export default ['$http', 'hs.map.service', 'hs.utils.service', '$rootScope', function ($http, OlMap, utils, $rootScope) {
    var me = this;

    /**
    * Get WFS service location without parameters from url string
    * @memberof hs.wfs.getCapabilitiesService
    * @function getPathFromUrl
    * @param {String} str Url string to parse
    * @returns {String} WFS service Url without params
    */
    this.getPathFromUrl = function (str) {
        if (str.indexOf('?') > -1)
            return str.substring(0, str.indexOf("?"));
        else
            return str;
    };

    /**
     * TODO: Probably the same as utils.paramsToURL
    * Create WFS parameter string from parameter object 
    * @memberof hs.wfs.getCapabilitiesService
    * @function param2String
    * @param {Object} obj Object with stored WFS service parameters
    * @returns {String} Parameter string or empty string if no object given 
    */
    this.params2String = function (obj) {
        return obj ? Object.keys(obj).map(function (key) {
            var val = obj[key];

            if (Array.isArray(val)) {
                return val.map(function (val2) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
                }).join('&');
            }

            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
        }).join('&') : '';
    };

    /**
    * Parse added service url and sends request GetCapabalities to WFS service
    * @memberof hs.wfs.getCapabilitiesService
    * @function requestGetCapabilities
    * @param {String} service_url Raw Url localization of service
    * @returns {Promise} Promise object -  Response to GetCapabalities request
    */
    this.requestGetCapabilities = function (service_url) {
        service_url = service_url.replace('&amp;', '&');
        me.service_url = service_url;
        var params = utils.getParamsFromUrl(service_url);
        var path = this.getPathFromUrl(service_url);
        if (angular.isUndefined(params.request) && angular.isUndefined(params.REQUEST)) params.request = 'GetCapabilities';
        else
            if (angular.isDefined(params.request)) params.request = 'GetCapabilities';
            else
                if (angular.isDefined(params.REQUEST)) params.REQUEST = 'GetCapabilities';
        if (angular.isUndefined(params.service) && angular.isUndefined(params.SERVICE)) params.service = 'WFS';
        if (angular.isUndefined(params.version) && angular.isUndefined(params.VERSION)) params.version = '1.1.0';
        var url = [path, me.params2String(params)].join('?');

        url = utils.proxify(url);
        var promise = $http.get(url);
        promise.then(function (r) {
            $rootScope.$broadcast('ows_wfs.capabilities_received', r)
        });
        return promise;
    };

    /**
    * Test if current map projection is in supported projection list
    * @memberof hs.wfs.getCapabilitiesService
    * @function currentProjectionSupported
    * @param {Array} srss List of supported projections
    * @returns {Boolean} True if map projection is in list, otherwise false
    */
    this.currentProjectionSupported = function (srss) {
        var found = false;
        angular.forEach(srss, function (val) {
            if (val.toUpperCase().indexOf(OlMap.map.getView().getProjection().getCode().toUpperCase().replace('EPSG:', 'EPSG::')) > -1) found = true;
        })
        return found;
    }

    /**
    * (DEPRECATED ?)
    * @memberof hs.wfs.getCapabilitiesService
    * @function getUrl
    * @param {} url
    * @param {} use_proxy
    */
    this.getUrl = function (url, use_proxy) {
        if (typeof use_proxy == 'undefined' || !use_proxy) return url;
        else return '/cgi-bin/proxy4ows.cgi?OWSURL=' + encodeURIComponent(url) + '&owsService=WMS';
    }
}
]