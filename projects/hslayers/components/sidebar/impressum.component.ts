import {Component, computed, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';

@Component({
  selector: 'hs-impressum',
  templateUrl: './impressum.component.html',
  imports: [TranslatePipe],
  standalone: true,
})
export class HsImpressumComponent {
  version = signal('16.0.0-next.2');
  logoError = signal(false);

  logoPath = computed(
    () => this.hsConfig.assetsPath + 'img/hslayers-ng-logo.png',
  );

  githubReleaseUrl = computed(
    () =>
      `https://github.com/hslayers/hslayers-ng/releases/tag/${this.version()}`,
  );

  constructor(public hsConfig: HsConfig) {}

  onLogoError(): void {
    this.logoError.set(true);
  }
}
