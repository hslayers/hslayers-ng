import {Component, OnInit} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsCoreService} from 'hslayers-ng/services/core';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';

@Component({
  selector: 'hs-share',
  templateUrl: './share.component.html',
})
export class HsShareComponent extends HsPanelBaseComponent implements OnInit {
  new_share = false;
  name = 'share';
  app: string;
  constructor(
    public HsShareService: HsShareService,
    public HsShareUrlService: HsShareUrlService,
    public HsCore: HsCoreService,
    public hsLanguageService: HsLanguageService,
    private hsConfig: HsConfig,
  ) {
    super();
  }

  /**
   * Create Iframe tag for embedded map
   * @returns Iframe tag with src attribute on embed Url and default width and height (1000x700px)
   */
  updateEmbedCode(): string {
    return this.HsShareService.getEmbedCode();
  }

  /**
   * Select right share Url based on shareLink property (either Permalink Url or PureMap url)
   * @returns Right share Url
   */
  getShareUrl(): string {
    return this.HsShareService.getShareUrl();
  }

  /**
   * Set share Url state invalid
   */
  invalidateShareUrl(): void {
    this.HsShareService.invalidateShareUrl();
  }

  /**
   * Create share post on selected social network
   */
  shareOnSocial(): void {
    this.HsShareService.shareOnSocial(this.new_share);
  }

  ngOnInit() {
    this.app = this.hsConfig.id;
    super.ngOnInit();
  }
}
