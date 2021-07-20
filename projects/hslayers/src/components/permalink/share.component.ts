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
   * @returns {string} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
   * @description Create Iframe tag for embedded map
   */
  updateEmbedCode(): string {
    return this.HsShareService.getEmbedCode();
  }

  /**
   * @returns {string} Right share Url
   * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
   */
  getShareUrl(): string {
    return this.HsShareService.getShareUrl();
  }

  /**
   * @description Set share Url state invalid
   */
  invalidateShareUrl(): void {
    this.HsShareService.invalidateShareUrl();
  }

  /**
   * @description Create share post on selected social network
   */
  shareOnSocial(): void {
    this.HsShareService.shareOnSocial(this.new_share);
  }
}
