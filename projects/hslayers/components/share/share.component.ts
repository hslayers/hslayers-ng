import {Component, OnInit, inject} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsShareService} from './share.service';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HslayersService} from 'hslayers-ng/core';

@Component({
  selector: 'hs-share',
  templateUrl: './share.component.html',
  standalone: false,
})
export class HsShareComponent extends HsPanelBaseComponent implements OnInit {
  hsShareService = inject(HsShareService);
  hsShareUrlService = inject(HsShareUrlService);
  hsCore = inject(HslayersService);
  hsLanguageService = inject(HsLanguageService);
  private hsConfig = inject(HsConfig);

  new_share = false;
  name = 'share';
  app: string;

  /**
   * Create Iframe tag for embedded map
   * @returns Iframe tag with src attribute on embed Url and default width and height (1000x700px)
   */
  updateEmbedCode(): string {
    return this.hsShareService.getEmbedCode();
  }

  /**
   * Select right share Url based on shareLink property (either Permalink Url or PureMap url)
   * @returns Right share Url
   */
  getShareUrl(): string {
    return this.hsShareService.getShareUrl();
  }

  /**
   * Set share Url state invalid
   */
  invalidateShareUrl(): void {
    this.hsShareService.invalidateShareUrl();
  }

  /**
   * Create share post on selected social network
   */
  shareOnSocial(): void {
    this.hsShareService.shareOnSocial(this.new_share);
  }

  ngOnInit() {
    this.app = this.hsConfig.id;
    super.ngOnInit();
  }
}
