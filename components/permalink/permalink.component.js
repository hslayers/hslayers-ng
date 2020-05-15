export default {
  template: [
    'HsConfig',
    (config) => {
      if (config.design == 'md') {
        return require('./partials/directivemd.html');
      } else {
        return require('./partials/directive.html');
      }
    },
  ],
  controller: [
    '$scope',
    'HsPermalinkUrlService',
    'HsPermalinkShareService',
    function ($scope, service, ShareService) {
      angular.extend($scope, {
        data: ShareService.data,
        new_share: false,

        /**
         * @function updateEmbedCode
         * @memberof hs.permalink
         * @returns {String} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
         * @description Create Iframe tag for embeded map
         */
        updateEmbedCode: function () {
          return ShareService.getEmbedCode();
        },

        /**
         * @function getShareUrl
         * @memberof hs.permalink
         * @returns {String} Right share Url
         * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
         */
        getShareUrl: function () {
          return ShareService.getShareUrl();
        },

        /**
         * @function invalidateShareUrl
         * @memberof hs.permalink
         * @description Set share Url state invalid
         */
        invalidateShareUrl: function () {
          ShareService.invalidateShareUrl();
        },

        /**
         * @function shareOnSocial
         * @memberof hs.permalink
         * @param {String} provider Social network provider for sharing
         * @description Create share post on selected social network
         */
        shareOnSocial: function (provider) {
          ShareService.shareOnSocial(provider, $scope.new_share);
        },
      });

      $scope.$emit('scope_loaded', 'Permalink');
    },
  ],
};
