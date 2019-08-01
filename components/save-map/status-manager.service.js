export default ['hs.map.service', 'Core', 'hs.utils.service', '$window', '$cookies', 'config', function (OlMap, Core, utils, $window, $cookies, config) {
    var me = this;
    angular.extend(me, {
        endpointUrl() {
            var hostName = location.protocol + '//' + location.host;
            if (angular.isDefined(config.hostname)) {
                if (config.hostname.status_manager && config.hostname.status_manager.url) {
                    return config.hostname.status_manager.url;
                }
                if (config.hostname.user && config.hostname.user.url) {
                    hostName = config.hostname.user.url;
                } else if (config.hostname.default && config.hostname.default.url) {
                    hostName = config.hostname.default.url
                }
            }
            return hostName + (config.status_manager_url || '/wwwlibs/statusmanager2/index.php')
        }
    });
    return me;
}]