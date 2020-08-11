/* eslint-disable jsdoc/require-returns */
import * as angular from 'angular';
import {Component, OnInit} from '@angular/core';
@Component({
  selector: 'hs-share',
  template: require('./partials/directive.html'),
})
export class HsShareComponent implements OnInit {

}

export default {
  template: (HsConfig) => {
    'ngInject';
    if (HsConfig.design == 'md') {
      return require('./partials/directivemd.html');
    } else {
      return require('./partials/directive.html');
    }
  },
  controller: function ($scope, HsPermalinkShareService) {
    'ngInject';
    angular.extend($scope, {
      data: HsPermalinkShareService.data,
      new_share: false,

      /**
       * @function updateEmbedCode
       * @memberof hs.permalink
       * @returns {string} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
       * @description Create Iframe tag for embeded map
       */
      updateEmbedCode: function () {
        return HsPermalinkShareService.getEmbedCode();
      },

      /**
       * @function getShareUrl
       * @memberof hs.permalink
       * @returns {string} Right share Url
       * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
       */
      getShareUrl: function () {
        return HsPermalinkShareService.getShareUrl();
      },

      /**
       * @function invalidateShareUrl
       * @memberof hs.permalink
       * @description Set share Url state invalid
       */
      invalidateShareUrl: function () {
        HsPermalinkShareService.invalidateShareUrl();
      },

      /**
       * @function shareOnSocial
       * @memberof hs.permalink
       * @param {string} provider Social network provider for sharing
       * @description Create share post on selected social network
       */
      shareOnSocial: function (provider) {
        HsPermalinkShareService.shareOnSocial(provider, $scope.new_share);
      },
    });

    $scope.$emit('scope_loaded', 'Permalink');
  },
};
