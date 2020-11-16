/* eslint-disable jsdoc/require-returns */
import {Component} from '@angular/core';
import {HsCoreService} from '../core/core.service';
import {HsShareService} from './share.service';
@Component({
  selector: 'hs-share',
  templateUrl: './partials/directive.html',
})
export class HsShareComponent {
  new_share = false;

  constructor(
    public HsShareService: HsShareService,
    public HsCore: HsCoreService
  ) {}

  /**
   * @function updateEmbedCode
   * @memberof hs.permalink
   * @returns {string} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
   * @description Create Iframe tag for embeded map
   */
  updateEmbedCode(): string {
    return this.HsShareService.getEmbedCode();
  }

  /**
   * @function getShareUrl
   * @memberof hs.permalink
   * @returns {string} Right share Url
   * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
   */
  getShareUrl(): string {
    return this.HsShareService.getShareUrl();
  }

  /**
   * @function invalidateShareUrl
   * @memberof hs.permalink
   * @description Set share Url state invalid
   */
  invalidateShareUrl(): void {
    this.HsShareService.invalidateShareUrl();
  }

  /**
   * @function shareOnSocial
   * @memberof hs.permalink
   * @description Create share post on selected social network
   */
  shareOnSocial(): void {
    this.HsShareService.shareOnSocial(this.new_share);
  }
}
