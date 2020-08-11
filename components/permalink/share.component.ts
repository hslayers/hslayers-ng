/* eslint-disable jsdoc/require-returns */
import {Component, OnInit} from '@angular/core';
import {HsShareService} from './share.service';
@Component({
  selector: 'hs-share',
  template: require('./partials/directive.html'),
})
export class HsShareComponent implements OnInit {
  new_share: false;

  constructor(private HsShareService: HsShareService) {}
  ngOnInit(): void {}

  /**
   * @function updateEmbedCode
   * @memberof hs.permalink
   * @returns {string} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
   * @description Create Iframe tag for embeded map
   */
  updateEmbedCode() {
    return this.HsShareService.getEmbedCode();
  }

  /**
   * @function getShareUrl
   * @memberof hs.permalink
   * @returns {string} Right share Url
   * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
   */
  getShareUrl() {
    return this.HsShareService.getShareUrl();
  }

  /**
   * @function invalidateShareUrl
   * @memberof hs.permalink
   * @description Set share Url state invalid
   */
  invalidateShareUrl() {
    this.HsShareService.invalidateShareUrl();
  }

  /**
   * @function shareOnSocial
   * @memberof hs.permalink
   * @param {string} provider Social network provider for sharing
   * @description Create share post on selected social network
   */
  shareOnSocial(provider) {
    this.HsShareService.shareOnSocial(provider, this.new_share);
  }
}
