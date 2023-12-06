import {Component, OnInit} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-share',
  templateUrl: './share.component.html',
})
export class HsShareComponent extends HsPanelBaseComponent implements OnInit {
  new_share = false;
  name = 'permalink';
  app: string;
  constructor(
    public HsShareService: HsShareService,
    public HsShareUrlService: HsShareUrlService,
    public HsCore: HsCoreService,
    public HsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService,
    private hsConfig: HsConfig,
  ) {
    super(HsLayoutService);
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
